import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// ─── NeonDB Client ───────────────────────────────────────────────────────────
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set.');
  return neon(url);
}

// ─── Table Initialization ─────────────────────────────────────────────────────
async function ensureTables() {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS org_config (id SERIAL PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, nim TEXT, name TEXT NOT NULL, division TEXT, role TEXT, phone TEXT, email TEXT, join_date TEXT, is_active BOOLEAN DEFAULT true, kelas TEXT, avatar_url TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT, date TEXT, start_time TEXT, end_time TEXT, location TEXT, location_type TEXT, qr_code_token TEXT, status TEXT DEFAULT 'upcoming', notes TEXT, division_target TEXT, organizer TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS attendance_records (id TEXT PRIMARY KEY, event_id TEXT, member_id TEXT, member_name TEXT, member_nim TEXT, division TEXT, status TEXT, timestamp TEXT, notes TEXT, proof_url TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, type TEXT, category TEXT, amount NUMERIC, date TEXT, description TEXT, recipient_or_payer TEXT, receipt_proof TEXT, recorded_by TEXT, related_event_id TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS dues_records (id TEXT PRIMARY KEY, member_id TEXT, year INTEGER, month INTEGER, week INTEGER, amount NUMERIC, status TEXT DEFAULT 'belum', payment_date TEXT, payment_method TEXT, receipt_number TEXT, notes TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS budget_plans (id TEXT PRIMARY KEY, proker_name TEXT, division TEXT, allocated_budget NUMERIC, realized_budget NUMERIC, date TEXT, status TEXT DEFAULT 'Direncanakan', created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS sekbid_members (id TEXT PRIMARY KEY, sekbid_id INTEGER, name TEXT, nis TEXT, role TEXT, grade_class TEXT, phone TEXT, email TEXT, avatar_url TEXT, status TEXT DEFAULT 'Aktif', task_or_focus TEXT, joined_period TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS admin_accounts (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, display_name TEXT NOT NULL, role TEXT NOT NULL, sekbid_id INTEGER, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`INSERT INTO admin_accounts (id,email,password,display_name,role) VALUES
    ('acc-admin-01','admin@osis.sch.id','admin.osis1','Administrator OSIS','Administrator (Ketua Umum OSIS)'),
    ('acc-bendahara-01','bendahara@osis.sch.id','bendahara123','Bendahara Umum OSIS','Bendahara Umum'),
    ('acc-sekretaris-01','sekretaris@osis.sch.id','sekretaris123','Sekretaris Umum OSIS','Sekretaris Umum')
    ON CONFLICT (email) DO NOTHING`;
}

let tablesReady: Promise<void> | null = null;
function ensureTablesOnce() {
  if (!tablesReady) {
    tablesReady = ensureTables().catch((error) => {
      tablesReady = null;
      throw error;
    });
  }
  return tablesReady;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
const mapMember = (r: any) => ({ id: r.id, nim: r.nim, name: r.name, division: r.division, role: r.role, phone: r.phone, email: r.email, joinDate: r.join_date, isActive: r.is_active, kelas: r.kelas, avatarUrl: r.avatar_url });
const mapEvent = (r: any) => ({ id: r.id, title: r.title, type: r.type, date: r.date, startTime: r.start_time, endTime: r.end_time, location: r.location, locationType: r.location_type, qrCodeToken: r.qr_code_token, status: r.status, notes: r.notes, divisionTarget: r.division_target, organizer: r.organizer });
const mapAttendance = (r: any) => ({ id: r.id, eventId: r.event_id, memberId: r.member_id, memberName: r.member_name, memberNim: r.member_nim, division: r.division, status: r.status, timestamp: r.timestamp, notes: r.notes, proofUrl: r.proof_url });
const mapTransaction = (r: any) => ({ id: r.id, type: r.type, category: r.category, amount: Number(r.amount), date: r.date, description: r.description, recipientOrPayer: r.recipient_or_payer, receiptProof: r.receipt_proof, recordedBy: r.recorded_by, relatedEventId: r.related_event_id });
const mapDues = (r: any) => ({ id: r.id, memberId: r.member_id, year: r.year, month: r.month, week: r.week, amount: Number(r.amount), status: r.status, paymentDate: r.payment_date, paymentMethod: r.payment_method, receiptNumber: r.receipt_number, notes: r.notes });
const mapBudget = (r: any) => ({ id: r.id, prokerName: r.proker_name, division: r.division, allocatedBudget: Number(r.allocated_budget), realizedBudget: Number(r.realized_budget), date: r.date, status: r.status });
const mapSekbid = (r: any) => ({ id: r.id, sekbidId: r.sekbid_id, name: r.name, nis: r.nis, role: r.role, gradeClass: r.grade_class, phone: r.phone, email: r.email, avatarUrl: r.avatar_url, status: r.status, taskOrFocus: r.task_or_focus, joinedPeriod: r.joined_period });

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Determine sub-path: req.query.path is an array like ['data'] or ['members', '123']
  const rawPath = Array.isArray(req.query.path)
    ? (req.query.path as string[]).join('/')
    : typeof req.query.path === 'string'
    ? req.query.path
    : '';
  const pathArr: string[] = rawPath.split('/').filter(Boolean);

  const segment = pathArr[0] ?? '';   // e.g. 'data', 'members', 'events' ...
  const subSeg  = pathArr[1] ?? '';   // e.g. 'bulk', or an ID
  const paramId = subSeg !== 'bulk' ? subSeg : '';

  try {
    if (segment === 'health' && req.method === 'GET') {
      const result = await getSql()`SELECT 1 AS ok`;
      return res.json({ status: 'ok', database: result[0]?.ok === 1 ? 'connected' : 'unexpected-response' });
    }

    const sql = getSql();

    if (segment === 'auth' && (subSeg === 'login' || subSeg === 'register') && req.method === 'POST') {
      await ensureTablesOnce();
    }

    if (segment === 'auth' && subSeg === 'login' && req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi.' });
      const accounts = await sql`SELECT id,email,display_name,role,sekbid_id FROM admin_accounts WHERE LOWER(email)=${email} AND password=${password} LIMIT 1`;
      if (accounts.length === 0) return res.status(401).json({ error: 'Email atau kata sandi tidak cocok.' });
      const account = accounts[0];
      return res.json({ user: { uid: account.id, email: account.email, displayName: account.display_name, role: account.role, sekbidId: account.sekbid_id || undefined } });
    }

    if (segment === 'auth' && subSeg === 'register' && req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const displayName = String(req.body?.displayName || '').trim();
      const role = String(req.body?.role || 'Pengurus OSIS').trim();
      if (!email || !password || !displayName) return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
      const id = `acc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const inserted = await sql`INSERT INTO admin_accounts (id,email,password,display_name,role) VALUES (${id},${email},${password},${displayName},${role}) ON CONFLICT (email) DO NOTHING RETURNING id,email,display_name,role`;
      if (inserted.length === 0) return res.status(409).json({ error: 'Email sudah terdaftar.' });
      const account = inserted[0];
      return res.json({ user: { uid: account.id, email: account.email, displayName: account.display_name, role: account.role } });
    }

    await ensureTablesOnce();

    // ── GET /api/db/data ────────────────────────────────────────────────────
    if (segment === 'data' && req.method === 'GET') {
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
    }

    // ── POST /api/db/config ─────────────────────────────────────────────────
    if (segment === 'config' && req.method === 'POST') {
      const config = req.body;
      const existing = await sql`SELECT id, data FROM org_config LIMIT 1`;
      const mergedConfig = existing[0]?.data?.sekbidList && !config.sekbidList
        ? { ...config, sekbidList: existing[0].data.sekbidList }
        : config;
      if (existing.length === 0) {
        await sql`INSERT INTO org_config (data) VALUES (${JSON.stringify(mergedConfig)})`;
      } else {
        await sql`UPDATE org_config SET data = ${JSON.stringify(mergedConfig)}, updated_at = NOW()`;
      }
      return res.json({ success: true });
    }

    if (segment === 'sekbid-details' && req.method === 'POST') {
      const { sekbidList } = req.body;
      if (!Array.isArray(sekbidList)) return res.status(400).json({ error: 'sekbidList harus berupa array.' });
      const existing = await sql`SELECT id, data FROM org_config LIMIT 1`;
      const data = { ...(existing[0]?.data || {}), sekbidList };
      if (existing.length === 0) await sql`INSERT INTO org_config (data) VALUES (${JSON.stringify(data)})`;
      else await sql`UPDATE org_config SET data=${JSON.stringify(data)}, updated_at=NOW()`;
      return res.json({ success: true });
    }

    // ── MEMBERS ─────────────────────────────────────────────────────────────
    if (segment === 'members') {
      if (req.method === 'POST' && subSeg === 'bulk') {
        const { members } = req.body;
        await sql`DELETE FROM members`;
        for (const m of members) {
          await sql`INSERT INTO members (id,nim,name,division,role,phone,email,join_date,is_active,kelas,avatar_url) VALUES (${m.id},${m.nim},${m.name},${m.division},${m.role},${m.phone},${m.email},${m.joinDate},${m.isActive},${m.kelas||null},${m.avatarUrl||null}) ON CONFLICT (id) DO UPDATE SET nim=EXCLUDED.nim,name=EXCLUDED.name,division=EXCLUDED.division,role=EXCLUDED.role,phone=EXCLUDED.phone,email=EXCLUDED.email,join_date=EXCLUDED.join_date,is_active=EXCLUDED.is_active,kelas=EXCLUDED.kelas,avatar_url=EXCLUDED.avatar_url`;
        }
        return res.json({ success: true });
      }
      if (req.method === 'POST') {
        const m = req.body;
        await sql`INSERT INTO members (id,nim,name,division,role,phone,email,join_date,is_active,kelas,avatar_url) VALUES (${m.id},${m.nim},${m.name},${m.division},${m.role},${m.phone},${m.email},${m.joinDate},${m.isActive},${m.kelas||null},${m.avatarUrl||null}) ON CONFLICT (id) DO UPDATE SET nim=EXCLUDED.nim,name=EXCLUDED.name,division=EXCLUDED.division,role=EXCLUDED.role,phone=EXCLUDED.phone,email=EXCLUDED.email,join_date=EXCLUDED.join_date,is_active=EXCLUDED.is_active,kelas=EXCLUDED.kelas,avatar_url=EXCLUDED.avatar_url`;
        return res.json({ success: true });
      }
      if (req.method === 'DELETE' && paramId) {
        await sql`DELETE FROM members WHERE id=${paramId}`;
        await sql`DELETE FROM attendance_records WHERE member_id=${paramId}`;
        await sql`DELETE FROM dues_records WHERE member_id=${paramId}`;
        return res.json({ success: true });
      }
    }

    // ── EVENTS ───────────────────────────────────────────────────────────────
    if (segment === 'events') {
      if (req.method === 'POST' && subSeg === 'bulk') {
        const { events } = req.body;
        await sql`DELETE FROM events`;
        for (const e of events) {
          await sql`INSERT INTO events (id,title,type,date,start_time,end_time,location,location_type,qr_code_token,status,notes,division_target,organizer) VALUES (${e.id},${e.title},${e.type},${e.date},${e.startTime},${e.endTime},${e.location},${e.locationType},${e.qrCodeToken},${e.status},${e.notes||null},${e.divisionTarget},${e.organizer}) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,type=EXCLUDED.type,date=EXCLUDED.date,start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,location=EXCLUDED.location,location_type=EXCLUDED.location_type,status=EXCLUDED.status,notes=EXCLUDED.notes`;
        }
        return res.json({ success: true });
      }
      if (req.method === 'POST') {
        const e = req.body;
        await sql`INSERT INTO events (id,title,type,date,start_time,end_time,location,location_type,qr_code_token,status,notes,division_target,organizer) VALUES (${e.id},${e.title},${e.type},${e.date},${e.startTime},${e.endTime},${e.location},${e.locationType},${e.qrCodeToken},${e.status},${e.notes||null},${e.divisionTarget},${e.organizer}) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,type=EXCLUDED.type,date=EXCLUDED.date,start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,location=EXCLUDED.location,location_type=EXCLUDED.location_type,status=EXCLUDED.status,notes=EXCLUDED.notes`;
        return res.json({ success: true });
      }
      if (req.method === 'DELETE' && paramId) {
        await sql`DELETE FROM attendance_records WHERE event_id=${paramId}`;
        await sql`DELETE FROM events WHERE id=${paramId}`;
        return res.json({ success: true });
      }
    }

    // ── ATTENDANCE ───────────────────────────────────────────────────────────
    if (segment === 'attendance') {
      if (req.method === 'POST' && subSeg === 'bulk') {
        const { records } = req.body;
        await sql`DELETE FROM attendance_records`;
        for (const r of records) {
          await sql`INSERT INTO attendance_records (id,event_id,member_id,member_name,member_nim,division,status,timestamp,notes,proof_url) VALUES (${r.id},${r.eventId},${r.memberId},${r.memberName},${r.memberNim},${r.division},${r.status},${r.timestamp},${r.notes||null},${r.proofUrl||null}) ON CONFLICT (id) DO NOTHING`;
        }
        return res.json({ success: true });
      }
      if (req.method === 'POST') {
        const r = req.body;
        await sql`INSERT INTO attendance_records (id,event_id,member_id,member_name,member_nim,division,status,timestamp,notes,proof_url) VALUES (${r.id},${r.eventId},${r.memberId},${r.memberName},${r.memberNim},${r.division},${r.status},${r.timestamp},${r.notes||null},${r.proofUrl||null}) ON CONFLICT (id) DO UPDATE SET event_id=EXCLUDED.event_id,member_id=EXCLUDED.member_id,status=EXCLUDED.status,timestamp=EXCLUDED.timestamp,notes=EXCLUDED.notes,proof_url=EXCLUDED.proof_url`;
        return res.json({ success: true });
      }
      if (req.method === 'DELETE' && paramId) {
        await sql`DELETE FROM attendance_records WHERE id=${paramId}`;
        return res.json({ success: true });
      }
    }

    // ── TRANSACTIONS ─────────────────────────────────────────────────────────
    if (segment === 'transactions') {
      if (req.method === 'POST' && subSeg === 'bulk') {
        const { transactions } = req.body;
        await sql`DELETE FROM transactions`;
        for (const t of transactions) {
          await sql`INSERT INTO transactions (id,type,category,amount,date,description,recipient_or_payer,receipt_proof,recorded_by,related_event_id) VALUES (${t.id},${t.type},${t.category},${t.amount},${t.date},${t.description},${t.recipientOrPayer},${t.receiptProof||null},${t.recordedBy},${t.relatedEventId||null}) ON CONFLICT (id) DO NOTHING`;
        }
        return res.json({ success: true });
      }
      if (req.method === 'POST') {
        const t = req.body;
        await sql`INSERT INTO transactions (id,type,category,amount,date,description,recipient_or_payer,receipt_proof,recorded_by,related_event_id) VALUES (${t.id},${t.type},${t.category},${t.amount},${t.date},${t.description},${t.recipientOrPayer},${t.receiptProof||null},${t.recordedBy},${t.relatedEventId||null}) ON CONFLICT (id) DO UPDATE SET type=EXCLUDED.type,category=EXCLUDED.category,amount=EXCLUDED.amount,date=EXCLUDED.date,description=EXCLUDED.description,recipient_or_payer=EXCLUDED.recipient_or_payer`;
        return res.json({ success: true });
      }
      if (req.method === 'DELETE' && paramId) {
        await sql`DELETE FROM transactions WHERE id=${paramId}`;
        return res.json({ success: true });
      }
    }

    // ── DUES ─────────────────────────────────────────────────────────────────
    if (segment === 'dues') {
      if (req.method === 'POST' && subSeg === 'bulk') {
        const { records } = req.body;
        await sql`DELETE FROM dues_records`;
        for (const d of records) {
          await sql`INSERT INTO dues_records (id,member_id,year,month,week,amount,status,payment_date,payment_method,receipt_number,notes) VALUES (${d.id},${d.memberId},${d.year},${d.month},${d.week||null},${d.amount},${d.status},${d.paymentDate||null},${d.paymentMethod||null},${d.receiptNumber||null},${d.notes||null}) ON CONFLICT (id) DO NOTHING`;
        }
        return res.json({ success: true });
      }
      if (req.method === 'POST') {
        const d = req.body;
        await sql`INSERT INTO dues_records (id,member_id,year,month,week,amount,status,payment_date,payment_method,receipt_number,notes) VALUES (${d.id},${d.memberId},${d.year},${d.month},${d.week||null},${d.amount},${d.status},${d.paymentDate||null},${d.paymentMethod||null},${d.receiptNumber||null},${d.notes||null}) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,amount=EXCLUDED.amount,payment_date=EXCLUDED.payment_date,payment_method=EXCLUDED.payment_method,receipt_number=EXCLUDED.receipt_number,notes=EXCLUDED.notes`;
        return res.json({ success: true });
      }
      if (req.method === 'DELETE' && paramId) {
        await sql`DELETE FROM dues_records WHERE id=${paramId}`;
        return res.json({ success: true });
      }
    }

    // ── BUDGET ───────────────────────────────────────────────────────────────
    if (segment === 'budget') {
      if (req.method === 'POST' && subSeg === 'bulk') {
        const { plans } = req.body;
        await sql`DELETE FROM budget_plans`;
        for (const b of plans) {
          await sql`INSERT INTO budget_plans (id,proker_name,division,allocated_budget,realized_budget,date,status) VALUES (${b.id},${b.prokerName},${b.division},${b.allocatedBudget},${b.realizedBudget},${b.date},${b.status}) ON CONFLICT (id) DO NOTHING`;
        }
        return res.json({ success: true });
      }
      if (req.method === 'POST') {
        const b = req.body;
        await sql`INSERT INTO budget_plans (id,proker_name,division,allocated_budget,realized_budget,date,status) VALUES (${b.id},${b.prokerName},${b.division},${b.allocatedBudget},${b.realizedBudget},${b.date},${b.status}) ON CONFLICT (id) DO UPDATE SET proker_name=EXCLUDED.proker_name,division=EXCLUDED.division,allocated_budget=EXCLUDED.allocated_budget,realized_budget=EXCLUDED.realized_budget,date=EXCLUDED.date,status=EXCLUDED.status`;
        return res.json({ success: true });
      }
      if (req.method === 'DELETE' && paramId) {
        await sql`DELETE FROM budget_plans WHERE id=${paramId}`;
        return res.json({ success: true });
      }
    }

    // ── SEKBID MEMBERS ───────────────────────────────────────────────────────
    if (segment === 'sekbid-members') {
      if (req.method === 'POST' && subSeg === 'bulk') {
        const { members } = req.body;
        await sql`DELETE FROM sekbid_members`;
        for (const m of members) {
          await sql`INSERT INTO sekbid_members (id,sekbid_id,name,nis,role,grade_class,phone,email,avatar_url,status,task_or_focus,joined_period) VALUES (${m.id},${m.sekbidId},${m.name},${m.nis},${m.role},${m.gradeClass},${m.phone},${m.email||null},${m.avatarUrl||null},${m.status},${m.taskOrFocus||null},${m.joinedPeriod||null}) ON CONFLICT (id) DO NOTHING`;
        }
        return res.json({ success: true });
      }
      if (req.method === 'POST') {
        const m = req.body;
        await sql`INSERT INTO sekbid_members (id,sekbid_id,name,nis,role,grade_class,phone,email,avatar_url,status,task_or_focus,joined_period) VALUES (${m.id},${m.sekbidId},${m.name},${m.nis},${m.role},${m.gradeClass},${m.phone},${m.email||null},${m.avatarUrl||null},${m.status},${m.taskOrFocus||null},${m.joinedPeriod||null}) ON CONFLICT (id) DO UPDATE SET sekbid_id=EXCLUDED.sekbid_id,name=EXCLUDED.name,nis=EXCLUDED.nis,role=EXCLUDED.role,grade_class=EXCLUDED.grade_class,phone=EXCLUDED.phone,email=EXCLUDED.email,status=EXCLUDED.status,task_or_focus=EXCLUDED.task_or_focus,joined_period=EXCLUDED.joined_period`;
        return res.json({ success: true });
      }
      if (req.method === 'DELETE' && paramId) {
        await sql`DELETE FROM sekbid_members WHERE id=${paramId}`;
        return res.json({ success: true });
      }
    }

    // ── SYNC (full upsert) ───────────────────────────────────────────────────
    if (segment === 'sync' && req.method === 'POST') {
      const { config, members, events, attendanceRecords, transactions, duesRecords, budgetPlans, sekbidMembers, sekbidList } = req.body;

      if (config) {
        const existing = await sql`SELECT id, data FROM org_config LIMIT 1`;
        const mergedConfig = sekbidList ? { ...config, sekbidList } : (existing[0]?.data?.sekbidList ? { ...config, sekbidList: existing[0].data.sekbidList } : config);
        if (existing.length === 0) await sql`INSERT INTO org_config (data) VALUES (${JSON.stringify(mergedConfig)})`;
        else await sql`UPDATE org_config SET data=${JSON.stringify(mergedConfig)},updated_at=NOW()`;
      }
      for (const m of members || []) {
        await sql`INSERT INTO members (id,nim,name,division,role,phone,email,join_date,is_active,kelas,avatar_url) VALUES (${m.id},${m.nim},${m.name},${m.division},${m.role},${m.phone},${m.email},${m.joinDate},${m.isActive},${m.kelas||null},${m.avatarUrl||null}) ON CONFLICT (id) DO UPDATE SET nim=EXCLUDED.nim,name=EXCLUDED.name,division=EXCLUDED.division,role=EXCLUDED.role,phone=EXCLUDED.phone,email=EXCLUDED.email,join_date=EXCLUDED.join_date,is_active=EXCLUDED.is_active,kelas=EXCLUDED.kelas,avatar_url=EXCLUDED.avatar_url`;
      }
      for (const e of events || []) {
        await sql`INSERT INTO events (id,title,type,date,start_time,end_time,location,location_type,qr_code_token,status,notes,division_target,organizer) VALUES (${e.id},${e.title},${e.type},${e.date},${e.startTime},${e.endTime},${e.location},${e.locationType},${e.qrCodeToken},${e.status},${e.notes||null},${e.divisionTarget},${e.organizer}) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,type=EXCLUDED.type,date=EXCLUDED.date,status=EXCLUDED.status`;
      }
      for (const r of attendanceRecords || []) {
        await sql`INSERT INTO attendance_records (id,event_id,member_id,member_name,member_nim,division,status,timestamp,notes,proof_url) VALUES (${r.id},${r.eventId},${r.memberId},${r.memberName},${r.memberNim},${r.division},${r.status},${r.timestamp},${r.notes||null},${r.proofUrl||null}) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,notes=EXCLUDED.notes`;
      }
      for (const t of transactions || []) {
        await sql`INSERT INTO transactions (id,type,category,amount,date,description,recipient_or_payer,receipt_proof,recorded_by,related_event_id) VALUES (${t.id},${t.type},${t.category},${t.amount},${t.date},${t.description},${t.recipientOrPayer},${t.receiptProof||null},${t.recordedBy},${t.relatedEventId||null}) ON CONFLICT (id) DO UPDATE SET amount=EXCLUDED.amount,description=EXCLUDED.description`;
      }
      for (const d of duesRecords || []) {
        await sql`INSERT INTO dues_records (id,member_id,year,month,week,amount,status,payment_date,payment_method,receipt_number,notes) VALUES (${d.id},${d.memberId},${d.year},${d.month},${d.week||null},${d.amount},${d.status},${d.paymentDate||null},${d.paymentMethod||null},${d.receiptNumber||null},${d.notes||null}) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,payment_date=EXCLUDED.payment_date`;
      }
      for (const b of budgetPlans || []) {
        await sql`INSERT INTO budget_plans (id,proker_name,division,allocated_budget,realized_budget,date,status) VALUES (${b.id},${b.prokerName},${b.division},${b.allocatedBudget},${b.realizedBudget},${b.date},${b.status}) ON CONFLICT (id) DO UPDATE SET realized_budget=EXCLUDED.realized_budget,status=EXCLUDED.status`;
      }
      for (const m of sekbidMembers || []) {
        await sql`INSERT INTO sekbid_members (id,sekbid_id,name,nis,role,grade_class,phone,email,avatar_url,status,task_or_focus,joined_period) VALUES (${m.id},${m.sekbidId},${m.name},${m.nis},${m.role},${m.gradeClass},${m.phone},${m.email||null},${m.avatarUrl||null},${m.status},${m.taskOrFocus||null},${m.joinedPeriod||null}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,role=EXCLUDED.role,status=EXCLUDED.status`;
      }

      return res.json({ success: true, message: 'Semua data berhasil disinkronkan ke NeonDB!' });
    }

    // ── 404 Fallback ─────────────────────────────────────────────────────────
    return res.status(404).json({ error: `Route not found: ${req.method} /api/db/${pathArr.join('/')}` });

  } catch (err: any) {
    console.error('[api/db] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
