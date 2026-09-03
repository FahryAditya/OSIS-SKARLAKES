import { neon } from '@neondatabase/serverless';

// Helper to get SQL client lazily after dotenv is initialized
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }
  return neon(url);
}

export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  const client = getSql();
  return client(strings, ...values);
};

/**
 * Initialize all database tables (run once on server start)
 */
export async function initializeDatabase(): Promise<void> {
  console.log('🗄️  Initializing NeonDB tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS org_config (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      nim TEXT,
      name TEXT NOT NULL,
      division TEXT,
      role TEXT,
      phone TEXT,
      email TEXT,
      join_date TEXT,
      is_active BOOLEAN DEFAULT true,
      kelas TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Auto-migrate missing columns for existing tables in NeonDB
  try {
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS kelas TEXT;`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS email TEXT;`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
  } catch (mErr) {
    console.warn('NeonDB Column Alter Warning:', mErr);
  }

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT,
      date TEXT,
      start_time TEXT,
      end_time TEXT,
      location TEXT,
      location_type TEXT,
      qr_code_token TEXT,
      status TEXT DEFAULT 'upcoming',
      notes TEXT,
      division_target TEXT,
      organizer TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      member_id TEXT,
      member_name TEXT,
      member_nim TEXT,
      division TEXT,
      status TEXT,
      timestamp TEXT,
      notes TEXT,
      proof_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT,
      category TEXT,
      amount NUMERIC,
      date TEXT,
      description TEXT,
      recipient_or_payer TEXT,
      receipt_proof TEXT,
      recorded_by TEXT,
      related_event_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dues_records (
      id TEXT PRIMARY KEY,
      member_id TEXT,
      year INTEGER,
      month INTEGER,
      week INTEGER,
      amount NUMERIC,
      status TEXT DEFAULT 'belum',
      payment_date TEXT,
      payment_method TEXT,
      receipt_number TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS budget_plans (
      id TEXT PRIMARY KEY,
      proker_name TEXT,
      division TEXT,
      allocated_budget NUMERIC,
      realized_budget NUMERIC,
      date TEXT,
      status TEXT DEFAULT 'Direncanakan',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sekbid_members (
      id TEXT PRIMARY KEY,
      sekbid_id INTEGER,
      name TEXT,
      nis TEXT,
      role TEXT,
      grade_class TEXT,
      phone TEXT,
      email TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'Aktif',
      task_or_focus TEXT,
      joined_period TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      sekbid_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Performance Indexes for NeonDB PostgreSQL
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance_records (event_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance_records (member_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dues_member ON dues_records (member_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sekbid_members_id ON sekbid_members (sekbid_id);`;
  } catch (idxErr) {
    console.warn('NeonDB Index Creation Notice:', idxErr);
  }

  console.log('✅ NeonDB tables initialized successfully.');
}

