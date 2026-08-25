/**
 * Database Seed Script for NeonDB (PostgreSQL)
 * Run using: npx tsx seed.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { sql, initializeDatabase } from './src/lib/db.js';
import { initialOrganizationConfig, initialMembers, initialEvents, initialTransactions, initialBudgetPlans } from './src/data/initialData.js';
import { initialSekbidMembers } from './src/data/sekbidData.js';

async function seed() {
  console.log('🌱 Starting NeonDB Database Seeding...');

  // 1. Ensure all tables exist
  await initializeDatabase();

  // 2. Seed Admin Accounts
  console.log('🔐 Seeding Administrator Accounts...');
  const adminAccounts = [
    {
      id: 'acc-admin-01',
      email: 'admin@osis.sch.id',
      password: 'admin.osis1',
      displayName: 'Administrator OSIS',
      role: 'Administrator (Ketua Umum OSIS)',
    },
    {
      id: 'acc-bendahara-01',
      email: 'bendahara@osis.sch.id',
      password: 'bendahara123',
      displayName: 'Bendahara Umum OSIS',
      role: 'Bendahara Umum',
    },
    {
      id: 'acc-sekretaris-01',
      email: 'sekretaris@osis.sch.id',
      password: 'sekretaris123',
      displayName: 'Sekretaris Umum OSIS',
      role: 'Sekretaris Umum',
    },
  ];

  for (const acc of adminAccounts) {
    await sql`
      INSERT INTO admin_accounts (id, email, password, display_name, role)
      VALUES (${acc.id}, ${acc.email}, ${acc.password}, ${acc.displayName}, ${acc.role})
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role
    `;
  }
  console.log(`✅ ${adminAccounts.length} Admin accounts seeded successfully.`);

  // 3. Seed Organization Config
  console.log('⚙️  Seeding Organization Config...');
  const configRows = await sql`SELECT id FROM org_config LIMIT 1`;
  if (configRows.length === 0) {
    await sql`INSERT INTO org_config (data) VALUES (${JSON.stringify(initialOrganizationConfig)})`;
  } else {
    await sql`UPDATE org_config SET data = ${JSON.stringify(initialOrganizationConfig)}, updated_at = NOW()`;
  }
  console.log('✅ Organization Config seeded successfully.');

  // 4. Seed Members
  if (initialMembers && initialMembers.length > 0) {
    console.log('👥 Seeding Initial Members...');
    for (const m of initialMembers) {
      await sql`
        INSERT INTO members (id, nim, name, division, role, phone, email, join_date, is_active, kelas, avatar_url)
        VALUES (${m.id}, ${m.nim}, ${m.name}, ${m.division}, ${m.role}, ${m.phone}, ${m.email}, ${m.joinDate}, ${m.isActive}, ${m.kelas || null}, ${m.avatarUrl || null})
        ON CONFLICT (id) DO UPDATE SET
          nim = EXCLUDED.nim, name = EXCLUDED.name, division = EXCLUDED.division, role = EXCLUDED.role,
          phone = EXCLUDED.phone, email = EXCLUDED.email, join_date = EXCLUDED.join_date, is_active = EXCLUDED.is_active
      `;
    }
    console.log(`✅ ${initialMembers.length} Members seeded.`);
  }

  // 5. Seed Events
  if (initialEvents && initialEvents.length > 0) {
    console.log('📅 Seeding Initial Events...');
    for (const e of initialEvents) {
      await sql`
        INSERT INTO events (id, title, type, date, start_time, end_time, location, location_type, qr_code_token, status, notes, division_target, organizer)
        VALUES (${e.id}, ${e.title}, ${e.type}, ${e.date}, ${e.startTime}, ${e.endTime}, ${e.location}, ${e.locationType}, ${e.qrCodeToken}, ${e.status}, ${e.notes || null}, ${e.divisionTarget}, ${e.organizer})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, type = EXCLUDED.type, date = EXCLUDED.date, status = EXCLUDED.status
      `;
    }
    console.log(`✅ ${initialEvents.length} Events seeded.`);
  }

  // 6. Seed Transactions
  if (initialTransactions && initialTransactions.length > 0) {
    console.log('💰 Seeding Initial Transactions...');
    for (const t of initialTransactions) {
      await sql`
        INSERT INTO transactions (id, type, category, amount, date, description, recipient_or_payer, receipt_proof, recorded_by, related_event_id)
        VALUES (${t.id}, ${t.type}, ${t.category}, ${t.amount}, ${t.date}, ${t.description}, ${t.recipientOrPayer}, ${t.receiptProof || null}, ${t.recordedBy}, ${t.relatedEventId || null})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`✅ ${initialTransactions.length} Transactions seeded.`);
  }

  // 7. Seed Budget Plans
  if (initialBudgetPlans && initialBudgetPlans.length > 0) {
    console.log('📊 Seeding Initial Budget Plans...');
    for (const b of initialBudgetPlans) {
      await sql`
        INSERT INTO budget_plans (id, proker_name, division, allocated_budget, realized_budget, date, status)
        VALUES (${b.id}, ${b.prokerName}, ${b.division}, ${b.allocatedBudget}, ${b.realizedBudget}, ${b.date}, ${b.status})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`✅ ${initialBudgetPlans.length} Budget plans seeded.`);
  }

  // 8. Seed Sekbid Members
  if (initialSekbidMembers && initialSekbidMembers.length > 0) {
    console.log('🏅 Seeding Sekbid Members...');
    for (const m of initialSekbidMembers) {
      await sql`
        INSERT INTO sekbid_members (id, sekbid_id, name, nis, role, grade_class, phone, email, avatar_url, status, task_or_focus, joined_period)
        VALUES (${m.id}, ${m.sekbidId}, ${m.name}, ${m.nis}, ${m.role}, ${m.gradeClass}, ${m.phone}, ${m.email || null}, ${m.avatarUrl || null}, ${m.status}, ${m.taskOrFocus || null}, ${m.joinedPeriod || null})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status
      `;
    }
    console.log(`✅ ${initialSekbidMembers.length} Sekbid members seeded.`);
  }

  console.log('\n🎉 NeonDB Seeding Completed Successfully!');
  console.log('📌 Login Admin:');
  console.log('   Email: admin@osis.sch.id');
  console.log('   Password: admin.osis1');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
