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
  CheckCircle2,
  Layers,
  Activity,
  Award,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart,
  Area,
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
  members = [],
  events = [],
  attendanceRecords = [],
  transactions = [],
  duesRecords = [],
  setActiveTab,
  onOpenSelfCheckIn,
  onOpenQuickTransaction,
  onViewReceipt,
}) => {
  const safeMembers = Array.isArray(members) ? members : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeAttendanceRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeDuesRecords = Array.isArray(duesRecords) ? duesRecords : [];

  // Financial calculations
  const totalMasuk = safeTransactions
    .filter(t => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKeluar = safeTransactions
    .filter(t => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalMasuk - totalKeluar;

  // Recalculate dynamic monthly data from transactions
  const monthMap: { [key: string]: { masuk: number; keluar: number } } = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  monthNames.slice(0, 6).forEach(m => {
    monthMap[m] = { masuk: 0, keluar: 0 };
  });

  safeTransactions.forEach(t => {
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
  safeTransactions
    .filter(t => t.type === 'keluar')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const pieData = Object.keys(expenseByCategory).map(cat => ({
    name: cat,
    value: expenseByCategory[cat],
  }));

  // Attendance rate
  const totalCompletedEvents = safeEvents.filter(e => e.status === 'completed').length;
  const totalHadirCount = safeAttendanceRecords.filter(r => r.status === 'hadir').length;
  const overallAttendanceRate = Math.round((totalHadirCount / (safeAttendanceRecords.length || 1)) * 100);

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
    const divRecords = safeAttendanceRecords.filter(r => r.division === div);
    const divHadir = divRecords.filter(r => r.status === 'hadir').length;
    const shortDivName = div.replace('Divisi ', '').replace('Badan Pengurus Harian ', '');
    const rate = divRecords.length > 0 ? Math.round((divHadir / divRecords.length) * 100) : 75; // fallback representation if empty
    return {
      division: shortDivName,
      fullName: div,
      rate: rate,
    };
  });

  // Dues arrears (Tunggakan) for months 1-3
  const currentMonthNum = 3; // March
  const pendingDuesRecords = safeDuesRecords.filter(d => d.month <= currentMonthNum && d.status === 'belum');
  const totalTunggakan = pendingDuesRecords.reduce((sum, d) => sum + d.amount, 0);

  const activeEvent = safeEvents.find(e => e.status === 'active');
  const recentTransactions = [...safeTransactions].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);
  const recentAttendance = [...safeAttendanceRecords].slice(-5).reverse();

  // Color bar array for division progress bars
  const PROGRESS_BAR_COLORS = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-sky-500',
    'bg-rose-500',
    'bg-teal-500'
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Welcome Card with Ambient Glow */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 sm:space-x-5">
            <div className="relative group">
              <img
                src={config.logoUrl || '/logo.png'}
                alt={`Logo ${config.shortName}`}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-2xl border-2 border-white/20 bg-white/10 shrink-0"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-900 w-4 h-4 rounded-full" title="Sistem Aktif" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Periode Kepengurusan {config.period}</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-tight truncate">
                {config.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl line-clamp-2 sm:line-clamp-none">
                {config.tagline} • Portal Transparansi Kas & Sesi Presensi Terpadu
              </p>
            </div>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-start md:justify-end gap-2.5 sm:gap-3 md:ml-auto shrink-0 pt-2 md:pt-0">
            <button
              onClick={onOpenSelfCheckIn}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4" />
              <span>Buka Presensi Sesi</span>
            </button>
            <button
              onClick={onOpenQuickTransaction}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Kas Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards - Soft Pastel Modern Styling with Floating White Circle Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Kas Utama (Soft Indigo Pastel) */}
        <div className="bg-indigo-50/70 border border-indigo-100/90 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-900/60 uppercase tracking-wider">Saldo Kas Utama</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight font-mono mt-1">
                {formatRupiah(currentBalance)}
              </p>
            </div>
            <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600 border border-indigo-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <Wallet className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="flex items-center mt-3 pt-2 border-t border-indigo-100/60 text-xs font-semibold text-emerald-700">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-2xs font-bold mr-2">
              <TrendingUp className="w-3 h-3 mr-1" /> Surplus
            </span>
            <span className="text-slate-600 text-2xs">Kas Terkelola Baik</span>
          </div>
        </div>

        {/* Card 2: Total Kas Masuk (Soft Mint Emerald Pastel) */}
        <div className="bg-emerald-50/70 border border-emerald-100/90 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-900/60 uppercase tracking-wider">Total Kas Masuk</span>
              <p className="text-2xl font-black text-emerald-800 tracking-tight font-mono mt-1">
                {formatRupiah(totalMasuk)}
              </p>
            </div>
            <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-emerald-600 border border-emerald-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="flex items-center mt-3 pt-2 border-t border-emerald-100/60 text-xs text-slate-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-2xs font-bold mr-2">
              ↑ +12.5%
            </span>
            <span className="text-2xs text-slate-500">{safeTransactions.filter(t => t.type === 'masuk').length} Transaksi</span>
          </div>
        </div>

        {/* Card 3: Total Kas Keluar (Soft Rose Pastel) */}
        <div className="bg-rose-50/70 border border-rose-100/90 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-900/60 uppercase tracking-wider">Total Kas Keluar</span>
              <p className="text-2xl font-black text-rose-800 tracking-tight font-mono mt-1">
                {formatRupiah(totalKeluar)}
              </p>
            </div>
            <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-rose-600 border border-rose-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="flex items-center mt-3 pt-2 border-t border-rose-100/60 text-xs text-slate-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-800 text-2xs font-bold mr-2">
              Terverifikasi
            </span>
            <span className="text-2xs text-slate-500">Operasional & Proker</span>
          </div>
        </div>

        {/* Card 4: Tingkat Kehadiran (Soft Sky Blue Pastel) */}
        <div className="bg-sky-50/70 border border-sky-100/90 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-sky-900/60 uppercase tracking-wider">Presensi Kehadiran</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {overallAttendanceRate}%
                </p>
                <span className="text-2xs font-semibold text-slate-500">
                  ({safeMembers.length} Anggota)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-sky-600 border border-sky-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <CalendarCheck2 className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="w-full bg-sky-200/60 rounded-full h-2 mt-3.5 overflow-hidden">
            <div 
              className="bg-sky-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(overallAttendanceRate, 100)}%` }} 
            />
          </div>
        </div>

      </div>

      {/* 10 Sekbid OSIS Portal Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-700/30">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-xs shrink-0">
            <Layers className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950">
                Fitur Unggulan
              </span>
              <span className="text-xs font-semibold text-indigo-200">Struktur Pengurus OSIS</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Struktur & Program Kerja 10 Sekbid OSIS
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Manajemen struktur lengkap Sekbid 1 s.d. Sekbid 10 dengan rincian Ketua, Wakil Ketua, Anggota, tugas khusus, dan program kerja unggulan.
            </p>
          </div>
        </div>
        <button
          id="btn-goto-sekbid-dashboard"
          onClick={() => setActiveTab('sekbid')}
          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-indigo-900 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-1.5 shrink-0 self-stretch md:self-auto justify-center hover:scale-105 active:scale-95"
        >
          <span>Buka 10 Sekbid</span>
          <ChevronRight className="w-4 h-4 text-indigo-700" />
        </button>
      </div>

      {/* Active Event Banner (If any) */}
      {activeEvent && (
        <div className="bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
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

      {/* Analytics Charts Section: Area Spline Gradient Chart & Centered Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Trend Area Chart (Curved Spline with Gradient Fill) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Arus Kas Organisasi (2026)</h2>
              <p className="text-xs text-slate-500">Tren Kas Masuk vs Kas Keluar dengan Gradien Arus Kas</p>
            </div>
            <button 
              onClick={() => setActiveTab('keuangan')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Buku Kas</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartCashflow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.30}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#f1f5f9' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis 
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`} 
                  tickLine={false} 
                  axisLine={{ stroke: '#f1f5f9' }} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <Tooltip 
                  formatter={(value: any) => [formatRupiah(Number(value) || 0), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Area type="monotone" dataKey="masuk" name="Kas Masuk" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMasuk)" />
                <Area type="monotone" dataKey="keluar" name="Kas Keluar" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorKeluar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut Chart with Centered Total Text */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <h2 className="text-base font-bold text-slate-900">Alokasi Pengeluaran</h2>
              <p className="text-xs text-slate-500">Pos pengeluaran kas terbesar</p>
            </div>

            <div className="h-48 w-full my-auto relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Belum ada', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Keluar</span>
                <span className="text-xs font-black text-slate-900 font-mono mt-0.5">
                  {formatRupiah(totalKeluar)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs max-h-28 overflow-y-auto pr-1">
            {pieData.map((item, idx) => {
              const percentage = totalKeluar > 0 ? Math.round((item.value / totalKeluar) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-slate-600 py-0.5">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="truncate text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-2xs text-slate-400 font-semibold">{percentage}%</span>
                    <span className="font-bold text-slate-800 font-mono">{formatRupiah(item.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3 Column Section: Division Progress Bars, Recent Transactions, and Activity Timeline Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Division Attendance Popularity Progress Bars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Keaktifan per Divisi</h2>
                <p className="text-xs text-slate-500">Tingkat kehadiran anggota</p>
              </div>
              <button 
                onClick={() => setActiveTab('absensi')}
                className="text-2xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Lihat Detail
              </button>
            </div>

            <div className="space-y-3">
              {divisionStats.map((div, idx) => (
                <div key={div.division} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[170px]">{div.division}</span>
                    <span className="font-bold text-slate-900 font-mono">{div.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${PROGRESS_BAR_COLORS[idx % PROGRESS_BAR_COLORS.length]}`} 
                      style={{ width: `${Math.min(div.rate, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>Presensi Rata-rata Organisasi:</span>
            <span className="font-bold text-indigo-600">{overallAttendanceRate}%</span>
          </div>
        </div>

        {/* Widget 2: Recent Transactions Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Catatan Kas Terakhir</h2>
                <p className="text-xs text-slate-500">Mutasi keuangan organisasi</p>
              </div>
              <button 
                onClick={() => setActiveTab('keuangan')}
                className="text-2xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Semua Transaksi →
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      tx.type === 'masuk' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.recipientOrPayer ? tx.recipientOrPayer.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{tx.description}</p>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                        <span className="px-1.5 py-0.2 rounded bg-slate-200/60 font-medium text-slate-700">{tx.category}</span>
                        <span>•</span>
                        <span>{formatDateIndo(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-xs font-black font-mono ${
                      tx.type === 'masuk' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {tx.type === 'masuk' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </p>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      tx.type === 'masuk' ? 'bg-emerald-100/80 text-emerald-800' : 'bg-rose-100/80 text-rose-800'
                    }`}>
                      {tx.type === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setActiveTab('keuangan')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Lihat Detail Transaksi Keuangan →
            </button>
          </div>
        </div>

        {/* Widget 3: Recent Activity Feed (Timeline Feed with Color-coded Icon Chips) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Aktivitas Terakhir</h2>
                <p className="text-xs text-slate-500">Timeline kegiatan pengurus</p>
              </div>
              <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                <Activity className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-3">
              {/* Activity item 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Sesi Presensi Rapat Pleno</p>
                  <p className="text-[11px] text-slate-500 truncate">Dihadiri oleh {totalHadirCount} anggota OSIS</p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">Baru saja</span>
              </div>

              {/* Activity item 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Iuran Anggota Masuk</p>
                  <p className="text-[11px] text-slate-500 truncate">Penerimaan iuran rutin dari anggota BPH</p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">1 jam lalu</span>
              </div>

              {/* Activity item 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Pembaruan Proker 10 Sekbid</p>
                  <p className="text-[11px] text-slate-500 truncate">Sekbid 3 Humas memperbarui program kerja</p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">3 jam lalu</span>
              </div>

              {/* Activity item 4 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Pencatatan Kwitansi Kas</p>
                  <p className="text-[11px] text-slate-500 truncate">Kwitansi operasional proker disetujui</p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">Kemarin</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="text-slate-500">Tunggakan Iuran: <b className="text-rose-600">{formatRupiah(totalTunggakan)}</b></span>
            <button
              onClick={() => setActiveTab('iuran')}
              className="font-bold text-indigo-600 hover:text-indigo-800"
            >
              Kelola Iuran →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

