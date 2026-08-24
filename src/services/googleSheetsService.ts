import { 
  OrganizationConfig, 
  Member, 
  AttendanceEvent, 
  AttendanceRecord, 
  Transaction, 
  MonthlyDuesRecord, 
  BudgetPlan 
} from '../types';

export interface SpreadsheetDataPayload {
  config: OrganizationConfig;
  members: Member[];
  events: AttendanceEvent[];
  attendanceRecords: AttendanceRecord[];
  transactions: Transaction[];
  duesRecords: MonthlyDuesRecord[];
  budgetPlans: BudgetPlan[];
}

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheets: string[];
  lastSynced?: string;
}

const SHEET_NAMES = {
  INFO: 'Info_Organisasi',
  MEMBERS: 'Data_Anggota',
  EVENTS: 'Kegiatan_Presensi',
  ATTENDANCE: 'Rekap_Presensi',
  TRANSACTIONS: 'Buku_Kas_Keuangan',
  DUES: 'Iuran_Kas_Bulanan',
  BUDGET: 'RAB_Anggaran',
};

/**
 * Helper to call Google Sheets API
 */
async function sheetsApiCall(endpoint: string, accessToken: string, options: RequestInit = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP ${res.status} ${res.statusText}`;
    throw new Error(`Google Sheets API Error: ${message}`);
  }

  return res.json();
}

/**
 * Creates a brand new Organization Database Spreadsheet in user's Google Drive
 */
export async function createOrganizationSpreadsheet(
  accessToken: string,
  payload: SpreadsheetDataPayload
): Promise<SpreadsheetInfo> {
  const title = `[Database] ${payload.config.shortName || 'Organisasi'} - ${payload.config.period || '2026/2027'} (Sistem Absensi & Keuangan)`;

  const createBody = {
    properties: {
      title,
      locale: 'id_ID',
      timeZone: 'Asia/Jakarta',
    },
    sheets: [
      { properties: { title: SHEET_NAMES.INFO, gridProperties: { rowCount: 50, columnCount: 10 } } },
      { properties: { title: SHEET_NAMES.MEMBERS, gridProperties: { rowCount: 200, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.EVENTS, gridProperties: { rowCount: 200, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.ATTENDANCE, gridProperties: { rowCount: 1000, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.TRANSACTIONS, gridProperties: { rowCount: 1000, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.DUES, gridProperties: { rowCount: 1000, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.BUDGET, gridProperties: { rowCount: 100, columnCount: 10 } } },
    ],
  };

  const created = await sheetsApiCall('', accessToken, {
    method: 'POST',
    body: JSON.stringify(createBody),
  });

  const spreadsheetId = created.spreadsheetId;

  // Now populate all initial sheets with formatted headers and data
  await syncAllToSpreadsheet(accessToken, spreadsheetId, payload);

  return {
    id: spreadsheetId,
    title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets: Object.values(SHEET_NAMES),
    lastSynced: new Date().toISOString(),
  };
}

/**
 * Syncs / Writes all current app state into the designated Google Spreadsheet
 */
export async function syncAllToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  payload: SpreadsheetDataPayload
): Promise<void> {
  const { config, members, events, attendanceRecords, transactions, duesRecords, budgetPlans } = payload;
  const nowStr = new Date().toLocaleString('id-ID');

  // 1. Info Organisasi Rows
  const infoValues: any[][] = [
    ['PARAMETER ORGANISASI', 'NILAI PENGATURAN', 'KETERANGAN'],
    ['Nama Lengkap', config.name, 'Nama resmi organisasi'],
    ['Singkatan / Kode', config.shortName, 'Kode unik organisasi'],
    ['Tagline / Kabinet', config.tagline, 'Tagline kepengurusan'],
    ['Periode', config.period, 'Tahun kepengurusan'],
    ['Institusi / Kampus', config.institution, 'Lembaga naungan'],
    ['Ketua Umum', config.leaderName, 'Penanggung jawab utama'],
    ['Sekretaris', config.secretaryName, 'Penanggung jawab administrasi & presensi'],
    ['Bendahara', config.treasurerName, 'Penanggung jawab keuangan & kas'],
    ['Iuran Kas Bulanan Standar', config.defaultMonthlyDue, 'Nominal iuran per anggota / bulan (IDR)'],
    ['Bank / E-Wallet Kas', config.bankName, 'Nama bank penerima kas'],
    ['Nomor Rekening Kas', config.bankAccountNumber, 'Nomor rekening organisasi'],
    ['Atas Nama Rekening', config.bankAccountHolder, 'Pemilik rekening'],
    ['Alamat Sekretariat', config.address, 'Lokasi sekretariat'],
    ['Email Kontak', config.contactEmail, 'Email resmi'],
    ['Telepon Kontak', config.contactPhone, 'Kontak narahubung'],
    ['Terakhir Disinkronkan', nowStr, 'Waktu sinkronisasi terakhir'],
  ];

  // 2. Data Anggota Rows
  const memberValues: any[][] = [
    ['ID ANGGOTA', 'NIM', 'NAMA LENGKAP', 'DIVISI', 'JABATAN / PERAN', 'NO. WHATSAPP', 'EMAIL', 'TANGGAL BERGABUNG', 'STATUS AKTIF'],
    ...members.map(m => [
      m.id,
      m.nim,
      m.name,
      m.division,
      m.role,
      m.phone,
      m.email,
      m.joinDate,
      m.isActive ? 'AKTIF' : 'NONAKTIF'
    ])
  ];

  // 3. Kegiatan Presensi Rows
  const eventValues: any[][] = [
    ['ID KEGIATAN', 'NAMA KEGIATAN', 'TIPE KEGIATAN', 'TANGGAL', 'WAKTU MULAI', 'WAKTU SELESAI', 'LOKASI', 'TIPE LOKASI', 'TARGET DIVISI', 'PENYELENGGARA', 'STATUS KEGIATAN'],
    ...events.map(e => [
      e.id,
      e.title,
      e.type,
      e.date,
      e.startTime,
      e.endTime,
      e.location,
      e.locationType,
      e.divisionTarget,
      e.organizer,
      e.status
    ])
  ];

  // 4. Rekap Presensi Rows
  const attendanceValues: any[][] = [
    ['ID RECORD', 'ID KEGIATAN', 'ID ANGGOTA', 'NIM', 'NAMA ANGGOTA', 'DIVISI', 'STATUS PRESENSI', 'WAKTU PRESENSI', 'KETERANGAN', 'BUKTI URL'],
    ...attendanceRecords.map(r => [
      r.id,
      r.eventId,
      r.memberId,
      r.memberNim,
      r.memberName,
      r.division,
      r.status.toUpperCase(),
      r.timestamp,
      r.notes || '',
      r.proofUrl || ''
    ])
  ];

  // 5. Buku Kas Keuangan Rows
  const transactionValues: any[][] = [
    ['ID TRANSAKSI', 'TIPE (MASUK/KELUAR)', 'KATEGORI', 'NOMINAL (RP)', 'TANGGAL', 'DESKRIPSI / KETERANGAN', 'PIHAK TERKAIT (PENYETOR/PENERIMA)', 'DICATAT OLEH'],
    ...transactions.map(t => [
      t.id,
      t.type.toUpperCase(),
      t.category,
      t.amount,
      t.date,
      t.description,
      t.recipientOrPayer,
      t.recordedBy
    ])
  ];

  // 6. Iuran Kas Bulanan Rows
  const duesValues: any[][] = [
    ['ID RECORD', 'ID ANGGOTA', 'TAHUN', 'BULAN (1-12)', 'NOMINAL (RP)', 'STATUS', 'TANGGAL BAYAR', 'METODE PEMBAYARAN', 'NO. KUITANSI', 'CATATAN'],
    ...duesRecords.map(d => [
      d.id,
      d.memberId,
      d.year,
      d.month,
      d.amount,
      d.status.toUpperCase(),
      d.paymentDate || '',
      d.paymentMethod || '',
      d.receiptNumber || '',
      d.notes || ''
    ])
  ];

  // 7. RAB Anggaran Rows
  const budgetValues: any[][] = [
    ['ID RAB', 'NAMA PROGRAM KERJA', 'DIVISI', 'ALOKASI ANGGARAN (RP)', 'REALISASI (RP)', 'TANGGAL PELAKSANAAN', 'STATUS'],
    ...budgetPlans.map(b => [
      b.id,
      b.prokerName,
      b.division,
      b.allocatedBudget,
      b.realizedBudget,
      b.date,
      b.status
    ])
  ];

  const valueData = [
    { range: `${SHEET_NAMES.INFO}!A1:C${infoValues.length + 10}`, values: infoValues },
    { range: `${SHEET_NAMES.MEMBERS}!A1:I${Math.max(memberValues.length + 50, 100)}`, values: memberValues },
    { range: `${SHEET_NAMES.EVENTS}!A1:K${Math.max(eventValues.length + 50, 100)}`, values: eventValues },
    { range: `${SHEET_NAMES.ATTENDANCE}!A1:J${Math.max(attendanceValues.length + 50, 100)}`, values: attendanceValues },
    { range: `${SHEET_NAMES.TRANSACTIONS}!A1:H${Math.max(transactionValues.length + 50, 100)}`, values: transactionValues },
    { range: `${SHEET_NAMES.DUES}!A1:J${Math.max(duesValues.length + 50, 100)}`, values: duesValues },
    { range: `${SHEET_NAMES.BUDGET}!A1:G${Math.max(budgetValues.length + 50, 100)}`, values: budgetValues },
  ];

  // First, clear existing values in each sheet
  try {
    await sheetsApiCall(`/${spreadsheetId}/values:batchClear`, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        ranges: [
          `${SHEET_NAMES.INFO}!A1:Z100`,
          `${SHEET_NAMES.MEMBERS}!A1:Z500`,
          `${SHEET_NAMES.EVENTS}!A1:Z500`,
          `${SHEET_NAMES.ATTENDANCE}!A1:Z5000`,
          `${SHEET_NAMES.TRANSACTIONS}!A1:Z5000`,
          `${SHEET_NAMES.DUES}!A1:Z5000`,
          `${SHEET_NAMES.BUDGET}!A1:Z500`,
        ]
      })
    });
  } catch (err) {
    console.warn('Batch clear ignored (sheet might be fresh):', err);
  }

  // Then batch update with new values
  await sheetsApiCall(`/${spreadsheetId}/values:batchUpdate`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueData,
    }),
  });
}

/**
 * Fetches and imports data directly from the connected Google Spreadsheet into the App
 */
export async function fetchDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Partial<SpreadsheetDataPayload>> {
  const ranges = [
    `${SHEET_NAMES.INFO}!A2:C20`,
    `${SHEET_NAMES.MEMBERS}!A2:I2000`,
    `${SHEET_NAMES.EVENTS}!A2:K1000`,
    `${SHEET_NAMES.ATTENDANCE}!A2:J5000`,
    `${SHEET_NAMES.TRANSACTIONS}!A2:H5000`,
    `${SHEET_NAMES.DUES}!A2:J5000`,
    `${SHEET_NAMES.BUDGET}!A2:G500`,
  ];

  const query = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await sheetsApiCall(`/${spreadsheetId}/values:batchGet?${query}`, accessToken);
  const valueRanges = res.valueRanges || [];

  const result: Partial<SpreadsheetDataPayload> = {};

  // 1. Members
  const memberRows = valueRanges[1]?.values || [];
  if (memberRows.length > 0) {
    result.members = memberRows
      .filter((row: any[]) => row && row[0] && row[2])
      .map((row: any[]): Member => ({
        id: String(row[0] || `m-${Date.now()}`),
        nim: String(row[1] || ''),
        name: String(row[2] || ''),
        division: (row[3] || 'Badan Pengurus Harian (BPH)') as any,
        role: (row[4] || 'Anggota Aktif') as any,
        phone: String(row[5] || ''),
        email: String(row[6] || ''),
        joinDate: String(row[7] || '2026-01-01'),
        isActive: String(row[8]).toUpperCase() !== 'NONAKTIF' && String(row[8]).toUpperCase() !== 'FALSE',
      }));
  }

  // 2. Events
  const eventRows = valueRanges[2]?.values || [];
  if (eventRows.length > 0) {
    result.events = eventRows
      .filter((row: any[]) => row && row[0] && row[1])
      .map((row: any[]): AttendanceEvent => ({
        id: String(row[0] || `evt-${Date.now()}`),
        title: String(row[1] || ''),
        type: (row[2] || 'Rapat Pleno') as any,
        date: String(row[3] || new Date().toISOString().split('T')[0]),
        startTime: String(row[4] || '09:00'),
        endTime: String(row[5] || '12:00'),
        location: String(row[6] || 'Sekretariat'),
        locationType: (row[7] === 'online' ? 'online' : 'offline') as any,
        divisionTarget: (row[8] || 'Semua Divisi') as any,
        organizer: String(row[9] || 'BPH'),
        status: (row[10] || 'active') as any,
        qrCodeToken: `${String(row[1]).slice(0, 4).toUpperCase()}-${String(row[0])}`,
      }));
  }

  // 3. Attendance Records
  const attRows = valueRanges[3]?.values || [];
  if (attRows.length > 0) {
    result.attendanceRecords = attRows
      .filter((row: any[]) => row && row[0] && row[1])
      .map((row: any[]): AttendanceRecord => ({
        id: String(row[0] || `att-${Date.now()}`),
        eventId: String(row[1] || ''),
        memberId: String(row[2] || ''),
        memberNim: String(row[3] || ''),
        memberName: String(row[4] || ''),
        division: (row[5] || 'Badan Pengurus Harian (BPH)') as any,
        status: (String(row[6] || 'hadir').toLowerCase()) as any,
        timestamp: String(row[7] || new Date().toISOString().slice(0, 16)),
        notes: row[8] ? String(row[8]) : undefined,
        proofUrl: row[9] ? String(row[9]) : undefined,
      }));
  }

  // 4. Transactions
  const txRows = valueRanges[4]?.values || [];
  if (txRows.length > 0) {
    result.transactions = txRows
      .filter((row: any[]) => row && row[0] && row[3])
      .map((row: any[]): Transaction => ({
        id: String(row[0] || `tx-${Date.now()}`),
        type: String(row[1]).toLowerCase().includes('keluar') ? 'keluar' : 'masuk',
        category: (row[2] || 'Lain-lain') as any,
        amount: Number(String(row[3]).replace(/[^0-9.-]/g, '')) || 0,
        date: String(row[4] || new Date().toISOString().split('T')[0]),
        description: String(row[5] || ''),
        recipientOrPayer: String(row[6] || ''),
        recordedBy: String(row[7] || 'Bendahara'),
      }));
  }

  // 5. Dues Records
  const duesRows = valueRanges[5]?.values || [];
  if (duesRows.length > 0) {
    result.duesRecords = duesRows
      .filter((row: any[]) => row && row[0] && row[1])
      .map((row: any[]): MonthlyDuesRecord => ({
        id: String(row[0] || `due-${Date.now()}`),
        memberId: String(row[1] || ''),
        year: Number(row[2]) || 2026,
        month: Number(row[3]) || 1,
        amount: Number(String(row[4]).replace(/[^0-9.-]/g, '')) || 20000,
        status: (String(row[5] || 'belum').toLowerCase()) as any,
        paymentDate: row[6] ? String(row[6]) : undefined,
        paymentMethod: row[7] ? (row[7] as any) : undefined,
        receiptNumber: row[8] ? String(row[8]) : undefined,
        notes: row[9] ? String(row[9]) : undefined,
      }));
  }

  // 6. Budget Plans
  const budgetRows = valueRanges[6]?.values || [];
  if (budgetRows.length > 0) {
    result.budgetPlans = budgetRows
      .filter((row: any[]) => row && row[0] && row[1])
      .map((row: any[]): BudgetPlan => ({
        id: String(row[0] || `rab-${Date.now()}`),
        prokerName: String(row[1] || ''),
        division: (row[2] || 'Badan Pengurus Harian (BPH)') as any,
        allocatedBudget: Number(String(row[3]).replace(/[^0-9.-]/g, '')) || 0,
        realizedBudget: Number(String(row[4]).replace(/[^0-9.-]/g, '')) || 0,
        date: String(row[5] || '2026-06-01'),
        status: (row[6] || 'Direncanakan') as any,
      }));
  }

  return result;
}

/**
 * Appends a single new transaction row into Google Sheets
 */
export async function appendTransactionToSheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction
): Promise<void> {
  const row = [
    tx.id,
    tx.type.toUpperCase(),
    tx.category,
    tx.amount,
    tx.date,
    tx.description,
    tx.recipientOrPayer,
    tx.recordedBy
  ];

  await sheetsApiCall(`/${spreadsheetId}/values/${SHEET_NAMES.TRANSACTIONS}!A:H:append?valueInputOption=USER_ENTERED`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      values: [row]
    })
  });
}

/**
 * Appends a single new attendance record row into Google Sheets
 */
export async function appendAttendanceToSheet(
  accessToken: string,
  spreadsheetId: string,
  rec: AttendanceRecord
): Promise<void> {
  const row = [
    rec.id,
    rec.eventId,
    rec.memberId,
    rec.memberNim,
    rec.memberName,
    rec.division,
    rec.status.toUpperCase(),
    rec.timestamp,
    rec.notes || '',
    rec.proofUrl || ''
  ];

  await sheetsApiCall(`/${spreadsheetId}/values/${SHEET_NAMES.ATTENDANCE}!A:J:append?valueInputOption=USER_ENTERED`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      values: [row]
    })
  });
}

/**
 * Validates access to spreadsheet and returns metadata
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetInfo> {
  const res = await sheetsApiCall(`/${spreadsheetId}?fields=properties.title,sheets.properties.title`, accessToken);
  const title = res.properties?.title || 'Google Spreadsheet';
  const sheets = (res.sheets || []).map((s: any) => s.properties?.title || '');

  return {
    id: spreadsheetId,
    title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets,
  };
}
