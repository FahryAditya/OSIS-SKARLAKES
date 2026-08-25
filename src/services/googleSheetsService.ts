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
 * Formats a sheet name and A1 cell range safely for Google Sheets API v4
 */
function formatRange(sheetTitle: string, cellRange: string): string {
  // Always wrap sheet name in single quotes to guarantee parsing with any special characters/numbers
  const escapedTitle = sheetTitle.replace(/'/g, "''");
  return `'${escapedTitle}'!${cellRange}`;
}

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
 * Ensures all required tab sheets exist in the spreadsheet.
 * If any tab is missing (e.g., when connecting to an empty/existing sheet), creates it.
 */
export async function ensureRequiredSheetsExist(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const metadata = await sheetsApiCall(`/${spreadsheetId}?fields=sheets.properties`, accessToken);
  const existingSheets: any[] = metadata.sheets || [];
  const existingSheetTitles: string[] = existingSheets.map((s: any) => s.properties?.title || '');

  const requiredSheets = [
    { title: SHEET_NAMES.INFO, rowCount: 50, columnCount: 10 },
    { title: SHEET_NAMES.MEMBERS, rowCount: 500, columnCount: 15 },
    { title: SHEET_NAMES.EVENTS, rowCount: 300, columnCount: 15 },
    { title: SHEET_NAMES.ATTENDANCE, rowCount: 2000, columnCount: 15 },
    { title: SHEET_NAMES.TRANSACTIONS, rowCount: 2000, columnCount: 15 },
    { title: SHEET_NAMES.DUES, rowCount: 2000, columnCount: 15 },
    { title: SHEET_NAMES.BUDGET, rowCount: 300, columnCount: 10 },
  ];

  const requestsToAdd: any[] = [];
  for (const sheet of requiredSheets) {
    if (!existingSheetTitles.includes(sheet.title)) {
      requestsToAdd.push({
        addSheet: {
          properties: {
            title: sheet.title,
            gridProperties: {
              rowCount: sheet.rowCount,
              columnCount: sheet.columnCount,
            },
          },
        },
      });
    }
  }

  if (requestsToAdd.length > 0) {
    const res = await sheetsApiCall(`/${spreadsheetId}:batchUpdate`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ requests: requestsToAdd }),
    });

    // If default "Sheet1" or "Lembar1" was empty and we just added all required sheets, optionally clean up default sheet
    try {
      const defaultSheet = existingSheets.find(
        (s: any) => (s.properties?.title === 'Sheet1' || s.properties?.title === 'Lembar1') && !requiredSheets.some(r => r.title === s.properties?.title)
      );
      if (defaultSheet && defaultSheet.properties?.sheetId !== undefined && (existingSheets.length + requestsToAdd.length) > 1) {
        await sheetsApiCall(`/${spreadsheetId}:batchUpdate`, accessToken, {
          method: 'POST',
          body: JSON.stringify({
            requests: [{ deleteSheet: { sheetId: defaultSheet.properties.sheetId } }]
          }),
        }).catch(() => {});
      }
    } catch {
      // Non-blocking cleanup
    }
  }
}

/**
 * Creates a brand new Organization Database Spreadsheet in user's Google Drive
 * and immediately provisions all 7 tabs and populates all initial data in one single shot.
 */
export async function createOrganizationSpreadsheet(
  accessToken: string,
  payload: SpreadsheetDataPayload
): Promise<SpreadsheetInfo> {
  const title = `[Database] ${payload.config.shortName || 'Organisasi'} - ${payload.config.period || '2026/2027'} (Sistem Absensi & Keuangan)`;

  // 1. Create spreadsheet directly with the 7 required sheets
  const createBody = {
    properties: {
      title,
      timeZone: 'Asia/Jakarta',
    },
    sheets: [
      { properties: { title: SHEET_NAMES.INFO, gridProperties: { rowCount: 50, columnCount: 10 } } },
      { properties: { title: SHEET_NAMES.MEMBERS, gridProperties: { rowCount: 500, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.EVENTS, gridProperties: { rowCount: 300, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.ATTENDANCE, gridProperties: { rowCount: 2000, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.TRANSACTIONS, gridProperties: { rowCount: 2000, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.DUES, gridProperties: { rowCount: 2000, columnCount: 15 } } },
      { properties: { title: SHEET_NAMES.BUDGET, gridProperties: { rowCount: 300, columnCount: 10 } } },
    ],
  };

  const created = await sheetsApiCall('', accessToken, {
    method: 'POST',
    body: JSON.stringify(createBody),
  });

  const spreadsheetId = created.spreadsheetId;

  // 2. Immediately populate all values into the freshly created sheets
  await syncAllToSpreadsheet(accessToken, spreadsheetId, payload, false);

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
  payload: SpreadsheetDataPayload,
  ensureTabs: boolean = true
): Promise<void> {
  // 0. Ensure all required sheet tabs exist in target spreadsheet (if requested)
  if (ensureTabs) {
    await ensureRequiredSheetsExist(accessToken, spreadsheetId);
  }

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
    { range: formatRange(SHEET_NAMES.INFO, `A1:C${infoValues.length + 10}`), values: infoValues },
    { range: formatRange(SHEET_NAMES.MEMBERS, `A1:I${Math.max(memberValues.length + 50, 100)}`), values: memberValues },
    { range: formatRange(SHEET_NAMES.EVENTS, `A1:K${Math.max(eventValues.length + 50, 100)}`), values: eventValues },
    { range: formatRange(SHEET_NAMES.ATTENDANCE, `A1:J${Math.max(attendanceValues.length + 50, 100)}`), values: attendanceValues },
    { range: formatRange(SHEET_NAMES.TRANSACTIONS, `A1:H${Math.max(transactionValues.length + 50, 100)}`), values: transactionValues },
    { range: formatRange(SHEET_NAMES.DUES, `A1:J${Math.max(duesValues.length + 50, 100)}`), values: duesValues },
    { range: formatRange(SHEET_NAMES.BUDGET, `A1:G${Math.max(budgetValues.length + 50, 100)}`), values: budgetValues },
  ];

  // First, clear existing values in each sheet
  try {
    await sheetsApiCall(`/${spreadsheetId}/values:batchClear`, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        ranges: [
          formatRange(SHEET_NAMES.INFO, 'A1:Z100'),
          formatRange(SHEET_NAMES.MEMBERS, 'A1:Z500'),
          formatRange(SHEET_NAMES.EVENTS, 'A1:Z500'),
          formatRange(SHEET_NAMES.ATTENDANCE, 'A1:Z5000'),
          formatRange(SHEET_NAMES.TRANSACTIONS, 'A1:Z5000'),
          formatRange(SHEET_NAMES.DUES, 'A1:Z5000'),
          formatRange(SHEET_NAMES.BUDGET, 'A1:Z500'),
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
  // Ensure required sheets exist in case user created an empty spreadsheet
  await ensureRequiredSheetsExist(accessToken, spreadsheetId);

  const ranges = [
    formatRange(SHEET_NAMES.INFO, 'A2:C20'),
    formatRange(SHEET_NAMES.MEMBERS, 'A2:I2000'),
    formatRange(SHEET_NAMES.EVENTS, 'A2:K1000'),
    formatRange(SHEET_NAMES.ATTENDANCE, 'A2:J5000'),
    formatRange(SHEET_NAMES.TRANSACTIONS, 'A2:H5000'),
    formatRange(SHEET_NAMES.DUES, 'A2:J5000'),
    formatRange(SHEET_NAMES.BUDGET, 'A2:G500'),
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

  await sheetsApiCall(`/${spreadsheetId}/values/${encodeURIComponent(formatRange(SHEET_NAMES.TRANSACTIONS, 'A:H'))}:append?valueInputOption=USER_ENTERED`, accessToken, {
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

  await sheetsApiCall(`/${spreadsheetId}/values/${encodeURIComponent(formatRange(SHEET_NAMES.ATTENDANCE, 'A:J'))}:append?valueInputOption=USER_ENTERED`, accessToken, {
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

// ============================================================================
// GOOGLE APPS SCRIPT (NO LOGIN REQUIRED) INTEGRATION
// ============================================================================

export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3M5-946m20t_codYwyT8du60L-1IViOqD6XQ1KWqlS_OBeeZ4R-HUXgnzfhYV0_uf-Q/exec';
export const APPS_SCRIPT_DEPLOYMENT_ID = 'AKfycby3M5-946m20t_codYwyT8du60L-1IViOqD6XQ1KWqlS_OBeeZ4R-HUXgnzfhYV0_uf-Q';

export const APPS_SCRIPT_CODE_TEMPLATE = `/**
 * ===================================================================
 * GOOGLE APPS SCRIPT SYNC WEBHOOK (SISTEM OSIS MANAGEMENT)
 * ===================================================================
 * Panduan Deployment:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus semua kode default dan tempelkan skrip ini.
 * 4. Klik tombol "Terapkan (Deploy)" > "Deployment Baru (New Deployment)".
 * 5. Pilih jenis "Aplikasi Web (Web App)":
 *    - Deskripsi: Webhook OSIS Sync
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Yang memiliki akses (Who has access): Siapa saja (Anyone)  <-- SANGAT PENTING!
 * 6. Klik "Terapkan (Deploy)" dan salin URL Web App (/exec).
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = e && e.parameter && e.parameter.action ? e.parameter.action : 'readAll';

    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', title: ss.getName(), time: new Date().toISOString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'readAll') {
      var result = {};
      var sheets = ss.getSheets();
      for (var i = 0; i < sheets.length; i++) {
        var s = sheets[i];
        var name = s.getName();
        var data = s.getDataRange().getValues();
        result[name] = data;
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', spreadsheetTitle: ss.getName(), data: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var content = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(content);
    var action = payload.action || 'syncAll';

    if (action === 'syncAll' && payload.sheets) {
      for (var sheetName in payload.sheets) {
        var rows = payload.sheets[sheetName];
        if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
          sheet = ss.insertSheet(sheetName);
        }
        sheet.clear();
        
        var numRows = rows.length;
        var numCols = 0;
        for (var r = 0; r < rows.length; r++) {
          if (rows[r] && rows[r].length > numCols) {
            numCols = rows[r].length;
          }
        }
        
        var normalized = [];
        for (var r = 0; r < rows.length; r++) {
          var row = rows[r] || [];
          var clone = row.slice();
          while (clone.length < numCols) clone.push('');
          normalized.push(clone);
        }

        if (numRows > 0 && numCols > 0) {
          sheet.getRange(1, 1, numRows, numCols).setValues(normalized);
        }
      }

      // Bersihkan tab default Sheet1 / Lembar1 jika kosong dan tab lain sudah ada
      var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
      if (defaultSheet && ss.getSheets().length > 1) {
        try { ss.deleteSheet(defaultSheet); } catch (e) {}
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Semua 7 lembar kerja berhasil dibuat & disinkronkan ke spreadsheet!',
        spreadsheetTitle: ss.getName(),
        syncedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'appendRow' && payload.sheetName && payload.row) {
      var sheet = ss.getSheetByName(payload.sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(payload.sheetName);
      }
      sheet.appendRow(payload.row);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Baris berhasil ditambahkan' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aksi tidak dikenali' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Transforms raw app state payload into sheet tables arrays
 */
export function buildSheetTablesDictionary(payload: SpreadsheetDataPayload): Record<string, any[][]> {
  const { config, members, events, attendanceRecords, transactions, duesRecords, budgetPlans } = payload;
  const nowStr = new Date().toLocaleString('id-ID');

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

  const budgetValues: any[][] = [
    ['ID RAB', 'NAMA PROGRAM KERJA', 'DIVISI PENANGGUNG JAWAB', 'ANGGARAN DIRENCANAKAN (RP)', 'REALISASI ANGGARAN (RP)', 'TARGET PELAKSANAAN', 'STATUS PROGRAM'],
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

  return {
    [SHEET_NAMES.INFO]: infoValues,
    [SHEET_NAMES.MEMBERS]: memberValues,
    [SHEET_NAMES.EVENTS]: eventValues,
    [SHEET_NAMES.ATTENDANCE]: attendanceValues,
    [SHEET_NAMES.TRANSACTIONS]: transactionValues,
    [SHEET_NAMES.DUES]: duesValues,
    [SHEET_NAMES.BUDGET]: budgetValues,
  };
}

/**
 * Helper to sanitize Google Apps Script URLs
 */
export function sanitizeAppsScriptUrl(url: string): string {
  let clean = (url || '').trim();
  if (clean.includes('/edit')) {
    clean = clean.replace(/\/edit.*$/, '/exec');
  }
  if (clean.includes('/dev')) {
    clean = clean.replace(/\/dev.*$/, '/exec');
  }
  return clean;
}

/**
 * Safely parses response text from Google Apps Script Web App
 */
function parseGasResponseText(text: string, url: string): any {
  const cleanText = (text || '').trim();

  // Check if response is HTML or login redirect
  if (
    cleanText.startsWith('<') ||
    cleanText.includes('<!DOCTYPE') ||
    cleanText.includes('<html') ||
    cleanText.includes('ServiceLogin') ||
    cleanText.includes('accounts.google.com')
  ) {
    if (cleanText.includes('ServiceLogin') || cleanText.includes('accounts.google.com')) {
      throw new Error(
        'Izin Akses Apps Script Diperlukan: Di Google Apps Script, klik "Deploy" > "Kelola Deployment", lalu pastikan "Yang memiliki akses (Who has access)" disetel ke "Siapa saja (Anyone)".'
      );
    }
    if (!url.endsWith('/exec')) {
      throw new Error('URL Apps Script tidak valid. Pastikan URL berakhiran "/exec" (bukan "/edit" atau "/dev").');
    }
    throw new Error(
      'Google Apps Script mengembalikan halaman HTML (bukan JSON). Pastikan Web App disetel "Who has access: Anyone" dan URL berakhiran "/exec".'
    );
  }

  try {
    return JSON.parse(cleanText);
  } catch {
    throw new Error(`Respon Google Apps Script tidak dapat dibaca sebagai JSON: ${cleanText.slice(0, 100)}`);
  }
}

/**
 * Syncs all application data via Google Apps Script Web App without requiring any Google Login popup
 */
export async function syncViaAppsScript(
  webhookUrl: string,
  payload: SpreadsheetDataPayload
): Promise<{ status: string; message?: string; spreadsheetTitle?: string; syncedAt?: string }> {
  const cleanUrl = sanitizeAppsScriptUrl(webhookUrl);
  if (!cleanUrl.startsWith('http')) {
    throw new Error('URL Google Apps Script tidak valid. Pastikan URL dimulai dengan http:// atau https://');
  }

  const sheets = buildSheetTablesDictionary(payload);
  const bodyData = {
    action: 'syncAll',
    sheets,
  };

  let proxyError: Error | null = null;

  // 1. Try server/Vercel proxy endpoint first
  try {
    const res = await fetch('/api/gas/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: cleanUrl, payload: bodyData }),
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      const data = JSON.parse(text);
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || data.message || 'Gagal sinkronisasi ke Apps Script');
      }
      return data;
    }
  } catch (err: any) {
    proxyError = err;
  }

  // 2. Direct fetch fallback
  try {
    const directRes = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(bodyData),
      redirect: 'follow',
    });

    const text = await directRes.text();
    const data = parseGasResponseText(text, cleanUrl);

    if (data.status === 'error') {
      throw new Error(data.message || data.error || 'Google Apps Script mengembalikan status error');
    }

    return data;
  } catch (directErr: any) {
    if (directErr.message?.includes('Izin Akses') || directErr.message?.includes('URL Apps Script') || directErr.message?.includes('HTML')) {
      throw directErr;
    }
    throw (proxyError && !proxyError.message?.includes('Unexpected token')) ? proxyError : directErr;
  }
}

/**
 * Fetches data via Google Apps Script Web App without requiring any Google Login popup
 */
export async function fetchViaAppsScript(
  webhookUrl: string
): Promise<Partial<SpreadsheetDataPayload>> {
  const cleanUrl = sanitizeAppsScriptUrl(webhookUrl);
  if (!cleanUrl.startsWith('http')) {
    throw new Error('URL Google Apps Script tidak valid. Pastikan URL dimulai dengan http:// atau https://');
  }

  let rawData: Record<string, any[][]> = {};
  let proxySuccess = false;
  let proxyError: Error | null = null;

  // 1. Try server proxy endpoint first
  try {
    const res = await fetch(`/api/gas/read?webhookUrl=${encodeURIComponent(cleanUrl)}&action=readAll`);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if ((contentType.includes('application/json') || text.trim().startsWith('{')) && res.ok) {
      const json = JSON.parse(text);
      if (json.status !== 'error' && json.data) {
        rawData = json.data;
        proxySuccess = true;
      } else if (json.status === 'error') {
        throw new Error(json.error || json.message || 'Gagal membaca data dari Google Apps Script');
      }
    }
  } catch (err: any) {
    proxyError = err;
  }

  // 2. Direct fetch fallback
  if (!proxySuccess) {
    try {
      const targetUrl = new URL(cleanUrl);
      targetUrl.searchParams.set('action', 'readAll');

      const directRes = await fetch(targetUrl.toString(), { redirect: 'follow' });
      const text = await directRes.text();
      const json = parseGasResponseText(text, cleanUrl);

      if (json.status === 'error') {
        throw new Error(json.message || json.error || 'Gagal membaca data dari Apps Script');
      }
      rawData = json.data || {};
    } catch (directErr: any) {
      if (directErr.message?.includes('Izin Akses') || directErr.message?.includes('URL Apps Script') || directErr.message?.includes('HTML')) {
        throw directErr;
      }
      throw (proxyError && !proxyError.message?.includes('Unexpected token')) ? proxyError : directErr;
    }
  }

  const result: Partial<SpreadsheetDataPayload> = {};

  // 1. Members
  const memberRows = rawData[SHEET_NAMES.MEMBERS] || [];
  if (memberRows.length > 1) {
    result.members = memberRows.slice(1)
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
  const eventRows = rawData[SHEET_NAMES.EVENTS] || [];
  if (eventRows.length > 1) {
    result.events = eventRows.slice(1)
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
  const attRows = rawData[SHEET_NAMES.ATTENDANCE] || [];
  if (attRows.length > 1) {
    result.attendanceRecords = attRows.slice(1)
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
  const txRows = rawData[SHEET_NAMES.TRANSACTIONS] || [];
  if (txRows.length > 1) {
    result.transactions = txRows.slice(1)
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
  const duesRows = rawData[SHEET_NAMES.DUES] || [];
  if (duesRows.length > 1) {
    result.duesRecords = duesRows.slice(1)
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
  const budgetRows = rawData[SHEET_NAMES.BUDGET] || [];
  if (budgetRows.length > 1) {
    result.budgetPlans = budgetRows.slice(1)
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
 * Checks if the backend server has GOOGLE_SHEETS_API_KEY configured
 */
export async function checkBackendSheetsKeyStatus(): Promise<{
  isConfigured: boolean;
  hasKey: boolean;
  maskedKey: string | null;
  message: string;
}> {
  try {
    const res = await fetch('/api/sheets/status');
    if (!res.ok) {
      return { isConfigured: false, hasKey: false, maskedKey: null, message: 'Server status check failed' };
    }
    return await res.json();
  } catch (err: any) {
    return { isConfigured: false, hasKey: false, maskedKey: null, message: err.message || 'Network error' };
  }
}

/**
 * Fetches spreadsheet data using the server-side backend API key
 */
export async function fetchSpreadsheetViaBackend(
  spreadsheetId: string,
  ranges?: string[]
): Promise<any> {
  const defaultRanges = [
    formatRange(SHEET_NAMES.INFO, 'A2:C20'),
    formatRange(SHEET_NAMES.MEMBERS, 'A2:I2000'),
    formatRange(SHEET_NAMES.EVENTS, 'A2:K1000'),
    formatRange(SHEET_NAMES.ATTENDANCE, 'A2:J5000'),
    formatRange(SHEET_NAMES.TRANSACTIONS, 'A2:H5000'),
    formatRange(SHEET_NAMES.DUES, 'A2:J5000'),
    formatRange(SHEET_NAMES.BUDGET, 'A2:G500'),
  ];

  const res = await fetch(`/api/sheets/${encodeURIComponent(spreadsheetId)}/values:batchGet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges: ranges || defaultRanges }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || `HTTP ${res.status}: Failed to read spreadsheet via backend API key`);
  }

  return await res.json();
}

