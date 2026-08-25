import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ status: 'error', error: 'DATABASE_URL belum dikonfigurasi di Vercel.' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 AS ok`;
    return res.status(200).json({
      status: 'ok',
      database: result[0]?.ok === 1 ? 'connected' : 'unexpected-response',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[health] NeonDB connection failed:', error);
    return res.status(500).json({ status: 'error', error: error?.message || 'NeonDB tidak dapat dihubungi.' });
  }
}
