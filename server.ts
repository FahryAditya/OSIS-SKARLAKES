import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      service: 'OSIS Management Server',
      sheetsConfigured: !!getGoogleSheetsApiKey()
    });
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
