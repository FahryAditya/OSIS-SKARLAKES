import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CalendarCheck2, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  QrCode, 
  Receipt, 
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  OrganizationConfig, 
  Member, 
  AttendanceEvent, 
  AttendanceRecord, 
  Transaction, 
  MonthlyDuesRecord, 
  ActiveTab 
} from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface DashboardViewProps {
  config: OrganizationConfig;
  members: Member[];
  events: AttendanceEvent[];
  attendanceRecords: AttendanceRecord[];
  transactions: Transaction[];
  duesRecords: MonthlyDuesRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSelfCheckIn: () => void;
  onOpenQuickTransaction: () => void;
  onViewReceipt: (tx: Transaction) => void;
}

const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  members,
  events,
  attendanceRecords,
  transactions,
  duesRecords,
  setActiveTab,
  onOpenSelfCheckIn,
  onOpenQuickTransaction,
  onViewReceipt,
}) => {
  // Financial calculations
  const totalMasuk = transactions
    .filter(t => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKeluar = transactions
    .filter(t => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalMasuk - totalKeluar;

  // Monthly breakdown (Jan, Feb, Mar, Apr, May, Jun, etc.)
  const monthlyCashflowData = [
    { month: 'Jan', masuk: 5280000, keluar: 0 },
    { month: 'Feb', masuk: 1730000, keluar: 950000 },
    { month: 'Mar', masuk: 3740000, keluar: 850000 },
    { month: 'Apr', masuk: 0, keluar: 0 },
    { month: 'Mei', masuk: 0, keluar: 0 },
    { month: 'Jun', masuk: 0, keluar: 0 },
  ];

  // Recalculate dynamic monthly data from transactions
  const monthMap: { [key: string]: { masuk: number; keluar: number } } = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  monthNames.slice(0, 6).forEach(m => {
    monthMap[m] = { masuk: 0, keluar: 0 };
  });

  transactions.forEach(t => {
    if (t.date) {
      const parts = t.date.split('-');
      if (parts.length >= 2) {
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 6) {
          const mKey = monthNames[mIdx];
          if (monthMap[mKey]) {
            if (t.type === 'masuk') monthMap[mKey].masuk += t.amount;
            else monthMap[mKey].keluar += t.amount;
          }
        }
      }
    }
  });

  const chartCashflow = Object.keys(monthMap).map(key => ({
    month: key,
    masuk: monthMap[key].masuk,
    keluar: monthMap[key].keluar,
  }));

  // Expense by Category
  const expenseByCategory: { [key: string]: number } = {};
  transactions
    .filter(t => t.type === 'keluar')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const pieData = Object.keys(expenseByCategory).map(cat => ({
    name: cat,
    value: expenseByCategory[cat],
  }));

  // Attendance rate
  const totalCompletedEvents = events.filter(e => e.status === 'completed').length;
  const totalPresensiExpected = totalCompletedEvents * members.length || 1;
  const totalHadirCount = attendanceRecords.filter(r => r.status === 'hadir').length;
  const overallAttendanceRate = Math.round((totalHadirCount / (attendanceRecords.length || 1)) * 100);

  // Attendance by division
  const divisions = [
    'Badan Pengurus Harian (BPH)',
    'Divisi Acara & Program',
    'Divisi Humas & Eksternal',
    'Divisi Media & Kreatif',
    'Divisi Logistik & Perlengkapan',
    'Divisi Danus (Dana Usaha)',
    'Divisi Litbang & Keilmuan',
  ];

  const divisionStats = divisions.map(div => {
    const divRecords = attendanceRecords.filter(r => r.division === div);
    const divHadir = divRecords.filter(r => r.status === 'hadir').length;
    const shortDivName = div.replace('Divisi ', '').replace('Badan Pengurus Harian ', '');
    const rate = divRecords.length > 0 ? Math.round((divHadir / divRecords.length) * 100) : 0;
    return {
      division: shortDivName,
      rate: rate || 85,
    };
  });

  // Dues arrears (Tunggakan) for months 1-3
  const currentMonthNum = 3; // March
  const pendingDuesRecords = duesRecords.filter(d => d.month <= currentMonthNum && d.status === 'belum');
  const totalTunggakan = pendingDuesRecords.reduce((sum, d) => sum + d.amount, 0);

  const activeEvent = events.find(e => e.status === 'active');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const recentTransactions = [...transactions].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);
  const recentAttendance = [...attendanceRecords].slice(-5).reverse();

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Welcome card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={`Logo ${config.shortName}`}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg border-2 border-white/20 bg-white/10 shrink-0"
              />
            ) : null}
            <div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                Periode Kepengurusan {config.period}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {config.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {config.tagline} • Sistem Terpadu Manajemen Presensi Kegiatan & Transparansi Keuangan Kas Organisasi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={onOpenSelfCheckIn}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4" />
              <span>Buka Presensi Sesi</span>
            </button>
            <button
              onClick={onOpenQuickTransaction}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Kas Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Kas Utama */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Kas Utama</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatRupiah(currentBalance)}
            </p>
            <div className="flex items-center mt-2 text-xs font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>Surplus Kas Stabil</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Kas Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kas Masuk</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              {formatRupiah(totalMasuk)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Dari {transactions.filter(t => t.type === 'masuk').length} transaksi penerimaan
            </p>
          </div>
        </div>

        {/* Card 3: Total Kas Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kas Keluar</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-700 tracking-tight font-mono">
              {formatRupiah(totalKeluar)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Untuk operasional & proker
            </p>
          </div>
        </div>

        {/* Card 4: Tingkat Kehadiran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Presensi</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {overallAttendanceRate}%
              </p>
              <span className="text-xs font-semibold text-slate-500">
                dari {members.length} Anggota
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min(overallAttendanceRate, 100)}%` }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Active Event Banner (If any) */}
      {activeEvent && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-pulse-subtle">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 animate-ping" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-emerald-600 text-white rounded">
                  Sesi Presensi Berlangsung
                </span>
                <span className="text-xs font-medium text-emerald-800">{activeEvent.type}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-1">
                {activeEvent.title}
              </h3>
              <div className="flex flex-wrap gap-x-4 text-xs text-slate-600 mt-1">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  {formatDateIndo(activeEvent.date)} • {activeEvent.startTime} - {activeEvent.endTime} WIB
                </span>
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  {activeEvent.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenSelfCheckIn}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Buka QR Presensi Sesi</span>
            </button>
            <button
              onClick={() => setActiveTab('absensi')}
              className="px-3 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-xl transition-colors"
            >
              Kelola Sesi
            </button>
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Arus Kas Organisasi (2026)</h2>
              <p className="text-xs text-slate-500">Perbandingan Kas Masuk vs Kas Keluar per Bulan</p>
            </div>
            <button 
              onClick={() => setActiveTab('keuangan')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <span>Lihat Buku Kas</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCashflow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis 
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <Tooltip 
                  formatter={(value: any) => [formatRupiah(Number(value) || 0), '']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="masuk" name="Kas Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="keluar" name="Kas Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-900">Alokasi Pengeluaran</h2>
            <p className="text-xs text-slate-500">Distribusi pos kas keluar</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: 'Belum ada', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1 text-xs max-h-24 overflow-y-auto pr-1">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800 shrink-0 font-mono">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Two Column Section: Recent Transactions & Attendance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Transactions List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catatan Kas Terakhir</h2>
              <p className="text-xs text-slate-500">Mutasi keuangan organisasi terbaru</p>
            </div>
            <button 
              onClick={() => setActiveTab('keuangan')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <span>Semua Transaksi</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    tx.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {tx.type === 'masuk' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{tx.description}</p>
                    <div className="flex items-center space-x-2 text-2xs text-slate-500 mt-0.5">
                      <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{tx.category}</span>
                      <span>•</span>
                      <span>{formatDateIndo(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-2 shrink-0">
                  <p className={`text-xs sm:text-sm font-bold font-mono ${
                    tx.type === 'masuk' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {tx.type === 'masuk' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                  <p className="text-2xs text-slate-400 truncate max-w-[100px]">{tx.recipientOrPayer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dues & Membership Status Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Kepatuhan Iuran Kas Anggota</h2>
                <p className="text-xs text-slate-500">Iuran rutin {formatRupiah(config.defaultMonthlyDue)}/bulan/anggota</p>
              </div>
              <button 
                onClick={() => setActiveTab('iuran')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <span>Kelola Iuran</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {/* Dues Progress Overview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Tunggakan Iuran Q1 (Jan - Mar):</span>
                <span className="font-mono text-rose-600 font-bold">{formatRupiah(totalTunggakan)}</span>
              </div>
              <div className="text-2xs text-slate-500 flex justify-between">
                <span>Status: {duesRecords.filter(d => d.month <= 3 && d.status === 'lunas').length} dari {members.length * 3} slot terbayar</span>
                <span className="font-bold text-emerald-600">
                  {Math.round((duesRecords.filter(d => d.month <= 3 && d.status === 'lunas').length / (members.length * 3)) * 100)}% Lunas
                </span>
              </div>
            </div>

            {/* Quick Unpaid Members List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Perlu Konfirmasi Pembayaran:</p>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {members.slice(0, 4).map((member) => {
                  const unpaidMonths = duesRecords
                    .filter(d => d.memberId === member.id && d.month <= 3 && d.status === 'belum')
                    .map(d => d.month);

                  return (
                    <div key={member.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-2xs text-slate-500">{member.division}</p>
                      </div>
                      <div className="text-right">
                        {unpaidMonths.length === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                            Lunas Q1
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800">
                            Belum Bulan {unpaidMonths.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Nomor Rekening Kas: <b>{config.bankName} - {config.bankAccountNumber}</b></span>
            <button
              onClick={() => setActiveTab('iuran')}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
            >
              Bayar Iuran
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
