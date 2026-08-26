import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { sql, initializeDatabase } from './src/lib/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize NeonDB tables on startup
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('⚠️  NeonDB initialization failed (DATABASE_URL missing or unreachable):', err);
  }

  // Helper function to get Google Sheets API Key
  const getGoogleSheetsApiKey = (): string | null => {
    return process.env.GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_API_KEY || null;
  };

  // ==========================================
  // API ROUTES (Always placed before Vite middleware)
  // ==========================================

  // Healthcheck endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'OSIS SKARLAKES Management Server',
      sheetsConfigured: !!getGoogleSheetsApiKey()
    });
  });

  app.get('/api/db/health', async (req: Request, res: Response) => {
    try {
      const result = await sql`SELECT 1 AS ok`;
      return res.json({ status: 'ok', database: result[0]?.ok === 1 ? 'connected' : 'unexpected-response' });
    } catch (err: any) {
      console.error('NeonDB healthcheck failed:', err);
      return res.status(500).json({ status: 'error', error: err.message || 'NeonDB tidak dapat dihubungi.' });
    }
  });

  // Check Google Sheets API Key configuration status
  app.get('/api/sheets/status', (req: Request, res: Response) => {
    const apiKey = getGoogleSheetsApiKey();
    res.json({
      isConfigured: !!apiKey,
      hasKey: !!apiKey,
      maskedKey: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : null,
      message: apiKey 
        ? 'Google Sheets API Key is configured on the backend server.' 
        : 'GOOGLE_SHEETS_API_KEY environment variable is not set.'
    });
  });

  // Server-side Spreadsheet Metadata Reader
  app.get('/api/sheets/:spreadsheetId', async (req: Request, res: Response) => {
    const { spreadsheetId } = req.params;
    const apiKey = getGoogleSheetsApiKey();

    if (!apiKey) {
      return res.status(500).json({
        error: 'GOOGLE_SHEETS_API_KEY is not configured on the backend server.',
        code: 'MISSING_API_KEY'
      });
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?key=${apiKey}&fields=properties.title,sheets.properties`;
      const googleRes = await fetch(url);
      const data = await googleRes.json();

      if (!googleRes.ok) {
        return res.status(googleRes.status).json(data);
      }

      return res.json(data);
    } catch (err: any) {
      console.error('Error fetching sheet metadata:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch spreadsheet metadata' });
    }
  });

  // Server-side Range Values Reader
  app.get('/api/sheets/:spreadsheetId/values/:range', async (req: Request, res: Response) => {
    const { spreadsheetId, range } = req.params;
    const apiKey = getGoogleSheetsApiKey();

    if (!apiKey) {
      return res.status(500).json({
        error: 'GOOGLE_SHEETS_API_KEY is not configured on the backend server.',
        code: 'MISSING_API_KEY'
      });
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?key=${apiKey}`;
      const googleRes = await fetch(url);
      const data = await googleRes.json();

      if (!googleRes.ok) {
        return res.status(googleRes.status).json(data);
      }

      return res.json(data);
    } catch (err: any) {
      console.error('Error fetching sheet range:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch sheet values' });
    }
  });

  // Server-side Batch Get Ranges Reader
  app.post('/api/sheets/:spreadsheetId/values:batchGet', async (req: Request, res: Response) => {
    const { spreadsheetId } = req.params;
    const { ranges } = req.body;
    const apiKey = getGoogleSheetsApiKey();

    if (!apiKey) {
      return res.status(500).json({
        error: 'GOOGLE_SHEETS_API_KEY is not configured on the backend server.',
        code: 'MISSING_API_KEY'
      });
    }

    if (!Array.isArray(ranges) || ranges.length === 0) {
      return res.status(400).json({ error: 'Body must include a "ranges" array with at least one range.' });
    }

    try {
      const queryParams = ranges.map((r: string) => `ranges=${encodeURIComponent(r)}`).join('&');
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${queryParams}&key=${apiKey}`;
      
      const googleRes = await fetch(url);
      const data = await googleRes.json();

      if (!googleRes.ok) {
        return res.status(googleRes.status).json(data);
      }

      return res.json(data);
    } catch (err: any) {
      console.error('Error fetching batch values:', err);
      return res.status(500).json({ error: err.message || 'Failed to batch get sheet values' });
    }
  });

  // ==========================================
  // NEONDB DATABASE API ROUTES
  // ==========================================

  app.post('/api/db/auth/login', async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const accounts = await sql`SELECT id,email,display_name,role,sekbid_id FROM admin_accounts WHERE LOWER(email)=${email} AND password=${password} LIMIT 1`;
      if (!accounts.length) return res.status(401).json({ error: 'Email atau kata sandi tidak cocok.' });
      const account = accounts[0];
      return res.json({ user: { uid: account.id, email: account.email, displayName: account.display_name, role: account.role } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Login NeonDB gagal.' });
    }
  });

  // GET /api/db/data - Fetch all data
  app.get('/api/db/data', async (req: Request, res: Response) => {
    try {
      const [configRows, members, events, attendance, transactions, dues, budget, sekbidMembers] = await Promise.all([
        sql`SELECT data FROM org_config ORDER BY id DESC LIMIT 1`,
        sql`SELECT * FROM members ORDER BY created_at ASC`,
        sql`SELECT * FROM events ORDER BY date DESC`,
        sql`SELECT * FROM attendance_records ORDER BY created_at DESC`,
        sql`SELECT * FROM transactions ORDER BY created_at DESC`,
        sql`SELECT * FROM dues_records ORDER BY created_at DESC`,
        sql`SELECT * FROM budget_plans ORDER BY created_at DESC`,
        sql`SELECT * FROM sekbid_members ORDER BY sekbid_id ASC, created_at ASC`,
      ]);

      const mapMember = (r: any) => ({
        id: r.id, nim: r.nim, name: r.name, division: r.division, role: r.role,
        phone: r.phone, email: r.email, joinDate: r.join_date, isActive: r.is_active,
        kelas: r.kelas, avatarUrl: r.avatar_url,
      });
      const mapEvent = (r: any) => ({
        id: r.id, title: r.title, type: r.type, date: r.date, startTime: r.start_time,
        endTime: r.end_time, location: r.location, locationType: r.location_type,
        qrCodeToken: r.qr_code_token, status: r.status, notes: r.notes,
        divisionTarget: r.division_target, organizer: r.organizer,
      });
      const mapAttendance = (r: any) => ({
        id: r.id, eventId: r.event_id, memberId: r.member_id, memberName: r.member_name,
        memberNim: r.member_nim, division: r.division, status: r.status,
        timestamp: r.timestamp, notes: r.notes, proofUrl: r.proof_url,
      });
      const mapTransaction = (r: any) => ({
        id: r.id, type: r.type, category: r.category, amount: Number(r.amount),
        date: r.date, description: r.description, recipientOrPayer: r.recipient_or_payer,
        receiptProof: r.receipt_proof, recordedBy: r.recorded_by, relatedEventId: r.related_event_id,
      });
      const mapDues = (r: any) => ({
        id: r.id, memberId: r.member_id, year: r.year, month: r.month, week: r.week,
        amount: Number(r.amount), status: r.status, paymentDate: r.payment_date,
        paymentMethod: r.payment_method, receiptNumber: r.receipt_number, notes: r.notes,
      });
      const mapBudget = (r: any) => ({
        id: r.id, prokerName: r.proker_name, division: r.division,
        allocatedBudget: Number(r.allocated_budget), realizedBudget: Number(r.realized_budget),
        date: r.date, status: r.status,
      });
      const mapSekbid = (r: any) => ({
        id: r.id, sekbidId: r.sekbid_id, name: r.name, nis: r.nis, role: r.role,
        gradeClass: r.grade_class, phone: r.phone, email: r.email, avatarUrl: r.avatar_url,
        status: r.status, taskOrFocus: r.task_or_focus, joinedPeriod: r.joined_period,
      });

      return res.json({
        config: configRows[0]?.data || null,
        members: members.map(mapMember),
        events: events.map(mapEvent),
        attendanceRecords: attendance.map(mapAttendance),
        transactions: transactions.map(mapTransaction),
        duesRecords: dues.map(mapDues),
        budgetPlans: budget.map(mapBudget),
        sekbidMembers: sekbidMembers.map(mapSekbid),
        sekbidList: configRows[0]?.data?.sekbidList || null,
      });
    } catch (err: any) {
      console.error('DB fetch all error:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch data from NeonDB' });
    }
  });

  // POST /api/db/config
  app.post('/api/db/config', async (req: Request, res: Response) => {
    try {
      const config = req.body;
      const existing = await sql`SELECT data FROM org_config ORDER BY id DESC LIMIT 1`;
      const mergedConfig = existing[0]?.data?.sekbidList && !config.sekbidList
        ? { ...config, sekbidList: existing[0].data.sekbidList }
        : config;
      await sql`
        INSERT INTO org_config (data) VALUES (${JSON.stringify(mergedConfig)})
        ON CONFLICT DO NOTHING
      `;
      await sql`UPDATE org_config SET data = ${JSON.stringify(mergedConfig)}, updated_at = NOW() WHERE id = (SELECT id FROM org_config ORDER BY id DESC LIMIT 1)`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/sekbid-details', async (req: Request, res: Response) => {
    try {
      const { sekbidList } = req.body;
      if (!Array.isArray(sekbidList)) return res.status(400).json({ error: 'sekbidList harus berupa array.' });
      const existing = await sql`SELECT data FROM org_config ORDER BY id DESC LIMIT 1`;
      const data = { ...(existing[0]?.data || {}), sekbidList };
      await sql`INSERT INTO org_config (data) VALUES (${JSON.stringify(data)}) ON CONFLICT DO NOTHING`;
      await sql`UPDATE org_config SET data=${JSON.stringify(data)}, updated_at=NOW() WHERE id=(SELECT id FROM org_config ORDER BY id DESC LIMIT 1)`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/members (upsert single)
  app.post('/api/db/members', async (req: Request, res: Response) => {
    try {
      const m = req.body;
      await sql`
        INSERT INTO members (id, nim, name, division, role, phone, email, join_date, is_active, kelas, avatar_url)
        VALUES (${m.id}, ${m.nim}, ${m.name}, ${m.division}, ${m.role}, ${m.phone}, ${m.email}, ${m.joinDate}, ${m.isActive}, ${m.kelas || null}, ${m.avatarUrl || null})
        ON CONFLICT (id) DO UPDATE SET
          nim = EXCLUDED.nim, name = EXCLUDED.name, division = EXCLUDED.division, role = EXCLUDED.role,
          phone = EXCLUDED.phone, email = EXCLUDED.email, join_date = EXCLUDED.join_date,
          is_active = EXCLUDED.is_active, kelas = EXCLUDED.kelas, avatar_url = EXCLUDED.avatar_url
      `;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/members/bulk
  app.post('/api/db/members/bulk', async (req: Request, res: Response) => {
    try {
      const { members } = req.body;
      await sql`DELETE FROM members`;
      for (const m of members) {
        await sql`
          INSERT INTO members (id, nim, name, division, role, phone, email, join_date, is_active, kelas, avatar_url)
          VALUES (${m.id}, ${m.nim}, ${m.name}, ${m.division}, ${m.role}, ${m.phone}, ${m.email}, ${m.joinDate}, ${m.isActive}, ${m.kelas || null}, ${m.avatarUrl || null})
          ON CONFLICT (id) DO UPDATE SET
            nim = EXCLUDED.nim, name = EXCLUDED.name, division = EXCLUDED.division, role = EXCLUDED.role,
            phone = EXCLUDED.phone, email = EXCLUDED.email, join_date = EXCLUDED.join_date,
            is_active = EXCLUDED.is_active, kelas = EXCLUDED.kelas, avatar_url = EXCLUDED.avatar_url
        `;
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/db/members/:id
  app.delete('/api/db/members/:id', async (req: Request, res: Response) => {
    try {
      await sql`DELETE FROM members WHERE id = ${req.params.id}`;
      await sql`DELETE FROM attendance_records WHERE member_id = ${req.params.id}`;
      await sql`DELETE FROM dues_records WHERE member_id = ${req.params.id}`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/events (upsert single)
  app.post('/api/db/events', async (req: Request, res: Response) => {
    try {
      const e = req.body;
      await sql`
        INSERT INTO events (id, title, type, date, start_time, end_time, location, location_type, qr_code_token, status, notes, division_target, organizer)
        VALUES (${e.id}, ${e.title}, ${e.type}, ${e.date}, ${e.startTime}, ${e.endTime}, ${e.location}, ${e.locationType}, ${e.qrCodeToken}, ${e.status}, ${e.notes || null}, ${e.divisionTarget}, ${e.organizer})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, type = EXCLUDED.type, date = EXCLUDED.date, start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time, location = EXCLUDED.location, location_type = EXCLUDED.location_type,
          qr_code_token = EXCLUDED.qr_code_token, status = EXCLUDED.status, notes = EXCLUDED.notes,
          division_target = EXCLUDED.division_target, organizer = EXCLUDED.organizer
      `;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/events/bulk
  app.post('/api/db/events/bulk', async (req: Request, res: Response) => {
    try {
      const { events } = req.body;
      await sql`DELETE FROM events`;
      for (const e of events) {
        await sql`
          INSERT INTO events (id, title, type, date, start_time, end_time, location, location_type, qr_code_token, status, notes, division_target, organizer)
          VALUES (${e.id}, ${e.title}, ${e.type}, ${e.date}, ${e.startTime}, ${e.endTime}, ${e.location}, ${e.locationType}, ${e.qrCodeToken}, ${e.status}, ${e.notes || null}, ${e.divisionTarget}, ${e.organizer})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title, type = EXCLUDED.type, date = EXCLUDED.date, start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time, location = EXCLUDED.location, location_type = EXCLUDED.location_type,
            qr_code_token = EXCLUDED.qr_code_token, status = EXCLUDED.status, notes = EXCLUDED.notes,
            division_target = EXCLUDED.division_target, organizer = EXCLUDED.organizer
        `;
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/db/events/:id
  app.delete('/api/db/events/:id', async (req: Request, res: Response) => {
    try {
      await sql`DELETE FROM attendance_records WHERE event_id = ${req.params.id}`;
      await sql`DELETE FROM events WHERE id = ${req.params.id}`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/attendance (upsert single)
  app.post('/api/db/attendance', async (req: Request, res: Response) => {
    try {
      const r = req.body;
      await sql`
        INSERT INTO attendance_records (id, event_id, member_id, member_name, member_nim, division, status, timestamp, notes, proof_url)
        VALUES (${r.id}, ${r.eventId}, ${r.memberId}, ${r.memberName}, ${r.memberNim}, ${r.division}, ${r.status}, ${r.timestamp}, ${r.notes || null}, ${r.proofUrl || null})
        ON CONFLICT (id) DO UPDATE SET
          event_id = EXCLUDED.event_id, member_id = EXCLUDED.member_id, status = EXCLUDED.status,
          timestamp = EXCLUDED.timestamp, notes = EXCLUDED.notes, proof_url = EXCLUDED.proof_url
      `;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/attendance/bulk
  app.post('/api/db/attendance/bulk', async (req: Request, res: Response) => {
    try {
      const { records } = req.body;
      await sql`DELETE FROM attendance_records`;
      for (const r of records) {
        await sql`
          INSERT INTO attendance_records (id, event_id, member_id, member_name, member_nim, division, status, timestamp, notes, proof_url)
          VALUES (${r.id}, ${r.eventId}, ${r.memberId}, ${r.memberName}, ${r.memberNim}, ${r.division}, ${r.status}, ${r.timestamp}, ${r.notes || null}, ${r.proofUrl || null})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/db/attendance/:id
  app.delete('/api/db/attendance/:id', async (req: Request, res: Response) => {
    try {
      await sql`DELETE FROM attendance_records WHERE id = ${req.params.id}`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/transactions (upsert single)
  app.post('/api/db/transactions', async (req: Request, res: Response) => {
    try {
      const t = req.body;
      await sql`
        INSERT INTO transactions (id, type, category, amount, date, description, recipient_or_payer, receipt_proof, recorded_by, related_event_id)
        VALUES (${t.id}, ${t.type}, ${t.category}, ${t.amount}, ${t.date}, ${t.description}, ${t.recipientOrPayer}, ${t.receiptProof || null}, ${t.recordedBy}, ${t.relatedEventId || null})
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type, category = EXCLUDED.category, amount = EXCLUDED.amount, date = EXCLUDED.date,
          description = EXCLUDED.description, recipient_or_payer = EXCLUDED.recipient_or_payer,
          receipt_proof = EXCLUDED.receipt_proof, recorded_by = EXCLUDED.recorded_by
      `;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/transactions/bulk
  app.post('/api/db/transactions/bulk', async (req: Request, res: Response) => {
    try {
      const { transactions } = req.body;
      await sql`DELETE FROM transactions`;
      for (const t of transactions) {
        await sql`
          INSERT INTO transactions (id, type, category, amount, date, description, recipient_or_payer, receipt_proof, recorded_by, related_event_id)
          VALUES (${t.id}, ${t.type}, ${t.category}, ${t.amount}, ${t.date}, ${t.description}, ${t.recipientOrPayer}, ${t.receiptProof || null}, ${t.recordedBy}, ${t.relatedEventId || null})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/db/transactions/:id
  app.delete('/api/db/transactions/:id', async (req: Request, res: Response) => {
    try {
      await sql`DELETE FROM transactions WHERE id = ${req.params.id}`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/dues (upsert single)
  app.post('/api/db/dues', async (req: Request, res: Response) => {
    try {
      const d = req.body;
      await sql`
        INSERT INTO dues_records (id, member_id, year, month, week, amount, status, payment_date, payment_method, receipt_number, notes)
        VALUES (${d.id}, ${d.memberId}, ${d.year}, ${d.month}, ${d.week || null}, ${d.amount}, ${d.status}, ${d.paymentDate || null}, ${d.paymentMethod || null}, ${d.receiptNumber || null}, ${d.notes || null})
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status, amount = EXCLUDED.amount, payment_date = EXCLUDED.payment_date,
          payment_method = EXCLUDED.payment_method, receipt_number = EXCLUDED.receipt_number, notes = EXCLUDED.notes
      `;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/dues/bulk
  app.post('/api/db/dues/bulk', async (req: Request, res: Response) => {
    try {
      const { records } = req.body;
      await sql`DELETE FROM dues_records`;
      for (const d of records) {
        await sql`
          INSERT INTO dues_records (id, member_id, year, month, week, amount, status, payment_date, payment_method, receipt_number, notes)
          VALUES (${d.id}, ${d.memberId}, ${d.year}, ${d.month}, ${d.week || null}, ${d.amount}, ${d.status}, ${d.paymentDate || null}, ${d.paymentMethod || null}, ${d.receiptNumber || null}, ${d.notes || null})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/db/dues/:id
  app.delete('/api/db/dues/:id', async (req: Request, res: Response) => {
    try {
      await sql`DELETE FROM dues_records WHERE id = ${req.params.id}`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/budget (upsert single)
  app.post('/api/db/budget', async (req: Request, res: Response) => {
    try {
      const b = req.body;
      await sql`
        INSERT INTO budget_plans (id, proker_name, division, allocated_budget, realized_budget, date, status)
        VALUES (${b.id}, ${b.prokerName}, ${b.division}, ${b.allocatedBudget}, ${b.realizedBudget}, ${b.date}, ${b.status})
        ON CONFLICT (id) DO UPDATE SET
          proker_name = EXCLUDED.proker_name, division = EXCLUDED.division,
          allocated_budget = EXCLUDED.allocated_budget, realized_budget = EXCLUDED.realized_budget,
          date = EXCLUDED.date, status = EXCLUDED.status
      `;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/budget/bulk
  app.post('/api/db/budget/bulk', async (req: Request, res: Response) => {
    try {
      const { plans } = req.body;
      await sql`DELETE FROM budget_plans`;
      for (const b of plans) {
        await sql`
          INSERT INTO budget_plans (id, proker_name, division, allocated_budget, realized_budget, date, status)
          VALUES (${b.id}, ${b.prokerName}, ${b.division}, ${b.allocatedBudget}, ${b.realizedBudget}, ${b.date}, ${b.status})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/db/budget/:id
  app.delete('/api/db/budget/:id', async (req: Request, res: Response) => {
    try {
      await sql`DELETE FROM budget_plans WHERE id = ${req.params.id}`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/sekbid-members (upsert single)
  app.post('/api/db/sekbid-members', async (req: Request, res: Response) => {
    try {
      const m = req.body;
      await sql`
        INSERT INTO sekbid_members (id, sekbid_id, name, nis, role, grade_class, phone, email, avatar_url, status, task_or_focus, joined_period)
        VALUES (${m.id}, ${m.sekbidId}, ${m.name}, ${m.nis}, ${m.role}, ${m.gradeClass}, ${m.phone}, ${m.email || null}, ${m.avatarUrl || null}, ${m.status}, ${m.taskOrFocus || null}, ${m.joinedPeriod || null})
        ON CONFLICT (id) DO UPDATE SET
          sekbid_id = EXCLUDED.sekbid_id, name = EXCLUDED.name, nis = EXCLUDED.nis, role = EXCLUDED.role,
          grade_class = EXCLUDED.grade_class, phone = EXCLUDED.phone, email = EXCLUDED.email,
          avatar_url = EXCLUDED.avatar_url, status = EXCLUDED.status,
          task_or_focus = EXCLUDED.task_or_focus, joined_period = EXCLUDED.joined_period
      `;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/sekbid-members/bulk
  app.post('/api/db/sekbid-members/bulk', async (req: Request, res: Response) => {
    try {
      const { members } = req.body;
      await sql`DELETE FROM sekbid_members`;
      for (const m of members) {
        await sql`
          INSERT INTO sekbid_members (id, sekbid_id, name, nis, role, grade_class, phone, email, avatar_url, status, task_or_focus, joined_period)
          VALUES (${m.id}, ${m.sekbidId}, ${m.name}, ${m.nis}, ${m.role}, ${m.gradeClass}, ${m.phone}, ${m.email || null}, ${m.avatarUrl || null}, ${m.status}, ${m.taskOrFocus || null}, ${m.joinedPeriod || null})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/db/sekbid-members/:id
  app.delete('/api/db/sekbid-members/:id', async (req: Request, res: Response) => {
    try {
      await sql`DELETE FROM sekbid_members WHERE id = ${req.params.id}`;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/db/sync - Full sync all data at once
  app.post('/api/db/sync', async (req: Request, res: Response) => {
    try {
      const { config, members, events, attendanceRecords, transactions, duesRecords, budgetPlans, sekbidMembers, sekbidList } = req.body;

      // Upsert config
      if (config) {
        const existing = await sql`SELECT id, data FROM org_config LIMIT 1`;
        const mergedConfig = sekbidList ? { ...config, sekbidList } : (existing[0]?.data?.sekbidList ? { ...config, sekbidList: existing[0].data.sekbidList } : config);
        if (existing.length === 0) {
          await sql`INSERT INTO org_config (data) VALUES (${JSON.stringify(mergedConfig)})`;
        } else {
          await sql`UPDATE org_config SET data = ${JSON.stringify(mergedConfig)}, updated_at = NOW()`;
        }
      }

      // Upsert members
      if (members?.length) {
        for (const m of members) {
          await sql`
            INSERT INTO members (id, nim, name, division, role, phone, email, join_date, is_active, kelas, avatar_url)
            VALUES (${m.id}, ${m.nim}, ${m.name}, ${m.division}, ${m.role}, ${m.phone}, ${m.email}, ${m.joinDate}, ${m.isActive}, ${m.kelas || null}, ${m.avatarUrl || null})
            ON CONFLICT (id) DO UPDATE SET
              nim = EXCLUDED.nim, name = EXCLUDED.name, division = EXCLUDED.division, role = EXCLUDED.role,
              phone = EXCLUDED.phone, email = EXCLUDED.email, join_date = EXCLUDED.join_date,
              is_active = EXCLUDED.is_active, kelas = EXCLUDED.kelas, avatar_url = EXCLUDED.avatar_url
          `;
        }
      }

      // Upsert events
      if (events?.length) {
        for (const e of events) {
          await sql`
            INSERT INTO events (id, title, type, date, start_time, end_time, location, location_type, qr_code_token, status, notes, division_target, organizer)
            VALUES (${e.id}, ${e.title}, ${e.type}, ${e.date}, ${e.startTime}, ${e.endTime}, ${e.location}, ${e.locationType}, ${e.qrCodeToken}, ${e.status}, ${e.notes || null}, ${e.divisionTarget}, ${e.organizer})
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title, type = EXCLUDED.type, date = EXCLUDED.date, start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time, location = EXCLUDED.location, location_type = EXCLUDED.location_type,
              status = EXCLUDED.status, notes = EXCLUDED.notes
          `;
        }
      }

      // Upsert attendance
      if (attendanceRecords?.length) {
        for (const r of attendanceRecords) {
          await sql`
            INSERT INTO attendance_records (id, event_id, member_id, member_name, member_nim, division, status, timestamp, notes, proof_url)
            VALUES (${r.id}, ${r.eventId}, ${r.memberId}, ${r.memberName}, ${r.memberNim}, ${r.division}, ${r.status}, ${r.timestamp}, ${r.notes || null}, ${r.proofUrl || null})
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes
          `;
        }
      }

      // Upsert transactions
      if (transactions?.length) {
        for (const t of transactions) {
          await sql`
            INSERT INTO transactions (id, type, category, amount, date, description, recipient_or_payer, receipt_proof, recorded_by, related_event_id)
            VALUES (${t.id}, ${t.type}, ${t.category}, ${t.amount}, ${t.date}, ${t.description}, ${t.recipientOrPayer}, ${t.receiptProof || null}, ${t.recordedBy}, ${t.relatedEventId || null})
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }

      // Upsert dues
      if (duesRecords?.length) {
        for (const d of duesRecords) {
          await sql`
            INSERT INTO dues_records (id, member_id, year, month, week, amount, status, payment_date, payment_method, receipt_number, notes)
            VALUES (${d.id}, ${d.memberId}, ${d.year}, ${d.month}, ${d.week || null}, ${d.amount}, ${d.status}, ${d.paymentDate || null}, ${d.paymentMethod || null}, ${d.receiptNumber || null}, ${d.notes || null})
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, payment_date = EXCLUDED.payment_date, payment_method = EXCLUDED.payment_method
          `;
        }
      }

      // Upsert budget
      if (budgetPlans?.length) {
        for (const b of budgetPlans) {
          await sql`
            INSERT INTO budget_plans (id, proker_name, division, allocated_budget, realized_budget, date, status)
            VALUES (${b.id}, ${b.prokerName}, ${b.division}, ${b.allocatedBudget}, ${b.realizedBudget}, ${b.date}, ${b.status})
            ON CONFLICT (id) DO UPDATE SET realized_budget = EXCLUDED.realized_budget, status = EXCLUDED.status
          `;
        }
      }

      // Upsert sekbid members
      if (sekbidMembers?.length) {
        for (const m of sekbidMembers) {
          await sql`
            INSERT INTO sekbid_members (id, sekbid_id, name, nis, role, grade_class, phone, email, avatar_url, status, task_or_focus, joined_period)
            VALUES (${m.id}, ${m.sekbidId}, ${m.name}, ${m.nis}, ${m.role}, ${m.gradeClass}, ${m.phone}, ${m.email || null}, ${m.avatarUrl || null}, ${m.status}, ${m.taskOrFocus || null}, ${m.joinedPeriod || null})
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status
          `;
        }
      }

      return res.json({ success: true, message: 'Semua data berhasil disinkronkan ke NeonDB!' });
    } catch (err: any) {
      console.error('DB sync error:', err);
      return res.status(500).json({ error: err.message || 'Failed to sync data to NeonDB' });
    }
  });

  // ==========================================
  // GOOGLE APPS SCRIPT (NO LOGIN SYNC) PROXY
  // ==========================================

  // Proxy for Google Apps Script Web App sync (POST)
  app.post('/api/gas/sync', async (req: Request, res: Response) => {
    const { webhookUrl, payload } = req.body;

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return res.status(400).json({ error: 'Parameter webhookUrl diperlukan.' });
    }

    try {
      // Send as text/plain or application/json, following 302 redirects automatically
      const gasResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const responseText = await gasResponse.text();

      // Detect if Google redirected to a login page instead of running anonymous web app
      if (responseText.includes('ServiceLogin') || responseText.includes('accounts.google.com') || responseText.includes('data-auto-init')) {
        return res.status(401).json({
          error: 'Akses Google Apps Script memerlukan otorisasi "Siapa saja (Anyone)". Saat deploy di Apps Script, pastikan memilih "Yang memiliki akses (Who has access)" -> "Siapa saja (Anyone)", bukan "Hanya saya".',
          code: 'AUTH_REQUIRED_FOR_GAS'
        });
      }

      try {
        const parsedJson = JSON.parse(responseText);
        return res.json(parsedJson);
      } catch {
        return res.json({ status: 'success', message: 'Tersinkronkan ke Google Apps Script', raw: responseText });
      }
    } catch (err: any) {
      console.error('Error proxying to Google Apps Script:', err);
      return res.status(500).json({ error: err.message || 'Gagal mengirim data ke Google Apps Script Web App' });
    }
  });

  // Proxy for Google Apps Script Web App read (GET)
  app.get('/api/gas/read', async (req: Request, res: Response) => {
    const webhookUrl = req.query.webhookUrl as string;
    const action = (req.query.action as string) || 'readAll';

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Parameter webhookUrl diperlukan.' });
    }

    try {
      const targetUrl = new URL(webhookUrl);
      targetUrl.searchParams.set('action', action);

      const gasResponse = await fetch(targetUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      const responseText = await gasResponse.text();

      if (responseText.includes('ServiceLogin') || responseText.includes('accounts.google.com') || responseText.includes('data-auto-init')) {
        return res.status(401).json({
          error: 'Akses Google Apps Script memerlukan otorisasi "Siapa saja (Anyone)". Saat deploy di Apps Script, pastikan memilih "Yang memiliki akses (Who has access)" -> "Siapa saja (Anyone)".',
          code: 'AUTH_REQUIRED_FOR_GAS'
        });
      }

      try {
        const parsedJson = JSON.parse(responseText);
        return res.json(parsedJson);
      } catch {
        return res.json({ status: 'success', raw: responseText });
      }
    } catch (err: any) {
      console.error('Error reading from Google Apps Script:', err);
      return res.status(500).json({ error: err.message || 'Gagal membaca data dari Google Apps Script' });
    }
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OSIS Full-stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
