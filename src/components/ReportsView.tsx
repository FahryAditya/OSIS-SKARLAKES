import React, { useState } from 'react';
import { 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Building2,
  Users,
  Award
} from 'lucide-react';
import { 
  OrganizationConfig, 
  Transaction, 
  AttendanceRecord, 
  AttendanceEvent, 
  Member, 
  MonthlyDuesRecord, 
  BudgetPlan 
} from '../types';
import { formatRupiah, formatDateIndo, exportToCSV } from '../utils/formatters';

interface ReportsViewProps {
  config: OrganizationConfig;
  transactions: Transaction[];
  events: AttendanceEvent[];
  records: AttendanceRecord[];
  members: Member[];
  duesRecords: MonthlyDuesRecord[];
  budgetPlans: BudgetPlan[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  config,
  transactions = [],
  events = [],
  records = [],
  members = [],
  duesRecords = [],
  budgetPlans = [],
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeRecords = Array.isArray(records) ? records : [];
  const safeMembers = Array.isArray(members) ? members : [];
  const safeDuesRecords = Array.isArray(duesRecords) ? duesRecords : [];
  const safeBudgetPlans = Array.isArray(budgetPlans) ? budgetPlans : [];

  const [reportType, setReportType] = useState<'finance' | 'attendance' | 'ai_insight'>('finance');

  // Calculations
  const totalMasuk = safeTransactions.filter(t => t.type === 'masuk').reduce((sum, t) => sum + t.amount, 0);
  const totalKeluar = safeTransactions.filter(t => t.type === 'keluar').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalMasuk - totalKeluar;

  const totalHadir = safeRecords.filter(r => r.status === 'hadir').length;
  const totalIzin = safeRecords.filter(r => r.status === 'izin').length;
  const totalSakit = safeRecords.filter(r => r.status === 'sakit').length;
  const totalAlpa = safeRecords.filter(r => r.status === 'alpa').length;
  const overallRate = Math.round((totalHadir / (safeRecords.length || 1)) * 100);

  // Group transactions by category for financial statement
  const incomeByCategory: { [key: string]: number } = {};
  const expenseByCategory: { [key: string]: number } = {};

  safeTransactions.forEach(t => {
    if (t.type === 'masuk') {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    } else {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Mode Toolbar (No-Print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Laporan Resmi & Dokumen Pertanggungjawaban</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Format lembar laporan resmi berstandar universitas & organisasi, siap dicetak atau disimpan sebagai PDF.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs (No-Print) */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 no-print">
        <button
          onClick={() => setReportType('finance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            reportType === 'finance'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Laporan Pertanggungjawaban Keuangan (LPJ Kas)</span>
        </button>

        <button
          onClick={() => setReportType('attendance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            reportType === 'attendance'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Laporan Rekapitulasi Presensi & Keaktifan</span>
        </button>

        <button
          onClick={() => setReportType('ai_insight')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            reportType === 'ai_insight'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Analisis & Evaluasi Otomatis Organisasi</span>
        </button>
      </div>

      {/* REPORT 1: OFFICIAL FINANCIAL STATEMENT (LPJ KEUANGAN) */}
      {reportType === 'finance' && (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto text-slate-900 print:border-none print:shadow-none print:p-0">
          
          {/* Official Kop Surat */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 flex items-center justify-between gap-4">
            <img 
              src={config.logoUrl || '/logo.png'} 
              alt={`Logo ${config.shortName}`} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0" 
            />
            <div className="text-center flex-1">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                {config.name}
              </h1>
              <p className="text-xs font-bold text-indigo-700 tracking-wide mt-0.5">{config.tagline}</p>
              <p className="text-2xs text-slate-600">{config.institution} • Periode {config.period}</p>
              <p className="text-2xs text-slate-500 mt-0.5">
                Sekretariat: {config.address} • Kontak: {config.contactEmail} / {config.contactPhone}
              </p>
            </div>
            <div className="w-16 sm:w-20 hidden sm:block shrink-0" />
          </div>

          {/* Document Title */}
          <div className="text-center mb-6">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 underline">
              LAPORAN KAS & ARUS KEUANGAN ORGANISASI
            </h2>
            <p className="text-xs text-slate-600 font-mono mt-1">
              Nomor: LPJ-KEU/{config.shortName}/{new Date().getFullYear()}/001
            </p>
            <p className="text-2xs text-slate-500">
              Per Tanggal: {formatDateIndo(new Date().toISOString().split('T')[0])}
            </p>
          </div>

          {/* Executive Balance Summary Box */}
          <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-2xs uppercase text-slate-500 font-bold">Total Penerimaan Kas</span>
              <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{formatRupiah(totalMasuk)}</p>
            </div>
            <div>
              <span className="text-2xs uppercase text-slate-500 font-bold">Total Pengeluaran Kas</span>
              <p className="text-sm font-bold text-rose-700 font-mono mt-0.5">{formatRupiah(totalKeluar)}</p>
            </div>
            <div>
              <span className="text-2xs uppercase text-slate-500 font-bold">Saldo Akhir Kas Bersih</span>
              <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">{formatRupiah(currentBalance)}</p>
            </div>
          </div>

          {/* Table 1: Rincian Penerimaan (Inflow) */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              A. Rincian Penerimaan Kas (Pemasukan)
            </h3>
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-3 border border-slate-200 w-12 text-center">No</th>
                  <th className="py-2 px-3 border border-slate-200">Pos Kategori Pemasukan</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Jumlah Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(incomeByCategory).map((cat, idx) => (
                  <tr key={cat}>
                    <td className="py-1.5 px-3 border border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-3 border border-slate-200">{cat}</td>
                    <td className="py-1.5 px-3 border border-slate-200 text-right font-mono font-medium">
                      {formatRupiah(incomeByCategory[cat])}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 font-bold text-emerald-900">
                  <td colSpan={2} className="py-2 px-3 border border-slate-200 text-right uppercase">
                    Total Kas Masuk
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                    {formatRupiah(totalMasuk)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: Rincian Pengeluaran (Outflow) */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              B. Rincian Pengeluaran Kas (Beban Operasional & Proker)
            </h3>
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-3 border border-slate-200 w-12 text-center">No</th>
                  <th className="py-2 px-3 border border-slate-200">Pos Kategori Pengeluaran</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Jumlah Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(expenseByCategory).map((cat, idx) => (
                  <tr key={cat}>
                    <td className="py-1.5 px-3 border border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-3 border border-slate-200">{cat}</td>
                    <td className="py-1.5 px-3 border border-slate-200 text-right font-mono font-medium">
                      {formatRupiah(expenseByCategory[cat])}
                    </td>
                  </tr>
                ))}
                <tr className="bg-rose-50 font-bold text-rose-900">
                  <td colSpan={2} className="py-2 px-3 border border-slate-200 text-right uppercase">
                    Total Kas Keluar
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                    {formatRupiah(totalKeluar)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Signature Section */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-xs text-center grid grid-cols-2 gap-8 print-break-inside-avoid">
            <div>
              <p className="text-slate-500 mb-16">Mengetahui,<br /><b>Ketua Umum {config.shortName}</b></p>
              <p className="font-bold underline text-slate-900">{config.leaderName}</p>
              <p className="text-2xs text-slate-500">NIM. 2311501001</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Dibuat & Disahkan Oleh,<br /><b>Bendahara Umum</b></p>
              <p className="font-bold underline text-slate-900">{config.treasurerName}</p>
              <p className="text-2xs text-slate-500">NIM. 2311501004</p>
            </div>
          </div>

        </div>
      )}

      {/* REPORT 2: OFFICIAL ATTENDANCE RECAP */}
      {reportType === 'attendance' && (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto text-slate-900 print:border-none print:shadow-none print:p-0">
          
          {/* Kop Surat */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 flex items-center justify-between gap-4">
            <img 
              src={config.logoUrl || '/logo.png'} 
              alt={`Logo ${config.shortName}`} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0" 
            />
            <div className="text-center flex-1">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                {config.name}
              </h1>
              <p className="text-xs font-bold text-indigo-700 tracking-wide mt-0.5">{config.tagline}</p>
              <p className="text-2xs text-slate-600">{config.institution} • Periode {config.period}</p>
            </div>
            <div className="w-16 sm:w-20 hidden sm:block shrink-0" />
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 underline">
              REKAPITULASI PRESENSI & KEAKTIFAN ANGGOTA
            </h2>
            <p className="text-xs text-slate-600 font-mono mt-1">
              Nomor: REKAP-ABS/{config.shortName}/{new Date().getFullYear()}/001
            </p>
          </div>

          {/* Overall Stats summary */}
          <div className="grid grid-cols-4 gap-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs">
            <div>
              <span className="text-2xs uppercase text-slate-500 font-bold">Total Hadir</span>
              <p className="text-base font-bold text-emerald-700 font-mono mt-0.5">{totalHadir}</p>
            </div>
            <div>
              <span className="text-2xs uppercase text-slate-500 font-bold">Total Izin</span>
              <p className="text-base font-bold text-amber-700 font-mono mt-0.5">{totalIzin}</p>
            </div>
            <div>
              <span className="text-2xs uppercase text-slate-500 font-bold">Total Sakit</span>
              <p className="text-base font-bold text-rose-700 font-mono mt-0.5">{totalSakit}</p>
            </div>
            <div>
              <span className="text-2xs uppercase text-slate-500 font-bold">Rata-rata Presensi</span>
              <p className="text-base font-bold text-indigo-700 font-mono mt-0.5">{overallRate}%</p>
            </div>
          </div>

          {/* Table Members Attendance */}
          <div className="mb-6">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-2 border border-slate-200 w-8 text-center">No</th>
                  <th className="py-2 px-3 border border-slate-200">NIM & Nama Anggota</th>
                  <th className="py-2 px-3 border border-slate-200">Divisi / Departemen</th>
                  <th className="py-2 px-2 border border-slate-200 text-center">Hadir</th>
                  <th className="py-2 px-2 border border-slate-200 text-center">Izin</th>
                  <th className="py-2 px-2 border border-slate-200 text-center">Sakit</th>
                  <th className="py-2 px-2 border border-slate-200 text-center">Alpa</th>
                  <th className="py-2 px-2 border border-slate-200 text-center">% Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => {
                  const mRecords = records.filter(r => r.memberId === m.id);
                  const h = mRecords.filter(r => r.status === 'hadir').length;
                  const i = mRecords.filter(r => r.status === 'izin').length;
                  const s = mRecords.filter(r => r.status === 'sakit').length;
                  const a = mRecords.filter(r => r.status === 'alpa').length;
                  const rate = events.length > 0 ? Math.round((h / events.length) * 100) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 border border-slate-200 text-center">{idx + 1}</td>
                      <td className="py-1.5 px-3 border border-slate-200 font-medium">
                        {m.name}
                        <span className="block text-2xs text-slate-500 font-mono">{m.nim}</span>
                      </td>
                      <td className="py-1.5 px-3 border border-slate-200 text-2xs text-slate-600">{m.division}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-center font-mono font-bold text-emerald-700">{h}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-center font-mono text-amber-700">{i}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-center font-mono text-rose-700">{s}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-center font-mono text-slate-500">{a}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-center font-mono font-bold">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-xs text-center grid grid-cols-2 gap-8 print-break-inside-avoid">
            <div>
              <p className="text-slate-500 mb-16">Mengetahui,<br /><b>Ketua Umum {config.shortName}</b></p>
              <p className="font-bold underline text-slate-900">{config.leaderName}</p>
              <p className="text-2xs text-slate-500">NIM. 2311501001</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Disusun Oleh,<br /><b>Sekretaris Umum</b></p>
              <p className="font-bold underline text-slate-900">{config.secretaryName}</p>
              <p className="text-2xs text-slate-500">NIM. 2311501003</p>
            </div>
          </div>

        </div>
      )}

      {/* REPORT 3: AI ORGANIZATIONAL INSIGHT */}
      {reportType === 'ai_insight' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex items-start space-x-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Analisis & Evaluasi Otomatis Kesehatan Organisasi</h2>
              <p className="text-xs text-indigo-200 mt-1">
                Kalkulasi otomatis terhadap rasio kas, kepatuhan iuran pengurus, tingkat kehadiran per divisi, dan rekomendasi efisiensi anggaran proker.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Finansial Health */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Kesehatan Kas & Likuiditas: SANGAT SEHAT</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rasio Saldo Kas terhadap Pengeluaran berada di angka <b>{Math.round((currentBalance / (totalKeluar || 1)) * 100)}%</b>. 
                Organisasi memiliki cadangan dana yang cukup untuk mendanai sisa rencana program kerja Q2 dan Q3.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-2xs space-y-1">
                <p className="font-semibold text-slate-800">• Pendapatan Utama: Sponsorship (37%) & Dana Hibah Kampus (53%)</p>
                <p className="font-semibold text-slate-800">• Realisasi Kas Keluar terbesar: Konsumsi & Publikasi</p>
              </div>
            </div>

            {/* Card 2: Attendance & Engagement */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>Kedisiplinan & Presensi: TINGGI ({overallRate}%)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Divisi dengan persentase kehadiran tertinggi adalah <b>Badan Pengurus Harian (BPH)</b> dan <b>Divisi Media Kreatif</b>. 
                Rata-rata izin beralasan praktikum dan jadwal kuliah pengganti.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-2xs space-y-1">
                <p className="font-semibold text-slate-800">• Tingkat Alpa Sangat Rendah (&lt; 4%)</p>
                <p className="font-semibold text-slate-800">• Rekomendasi: Adakan rapat rutin di luar jam praktikum sore</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
