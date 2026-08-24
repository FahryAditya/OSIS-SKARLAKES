import React, { useState } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  Receipt, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  BudgetPlan, 
  OrganizationConfig, 
  AttendanceEvent 
} from '../types';
import { formatRupiah, formatDateIndo, exportToCSV } from '../utils/formatters';

interface FinanceViewProps {
  transactions: Transaction[];
  budgetPlans: BudgetPlan[];
  events: AttendanceEvent[];
  config: OrganizationConfig;
  onOpenAddTransaction: (type?: TransactionType) => void;
  onViewReceipt: (tx: Transaction) => void;
  onPrintReport: () => void;
  onAddBudgetPlan: (plan: Omit<BudgetPlan, 'id'>) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  budgetPlans,
  events,
  config,
  onOpenAddTransaction,
  onViewReceipt,
  onPrintReport,
  onAddBudgetPlan,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'rab'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isRabModalOpen, setIsRabModalOpen] = useState(false);

  // New RAB state
  const [rabProker, setRabProker] = useState('');
  const [rabDivision, setRabDivision] = useState<string>('Divisi Acara & Program');
  const [rabBudgetStr, setRabBudgetStr] = useState('');
  const [rabDate, setRabDate] = useState(new Date().toISOString().split('T')[0]);

  // Sort chronological for calculating running balance
  const sortedChronological = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));
  
  let running = 0;
  const withRunningBalance = sortedChronological.map(tx => {
    if (tx.type === 'masuk') running += tx.amount;
    else running -= tx.amount;
    return { ...tx, runningBalance: running };
  });

  // Then display newest first
  const displayTransactions = [...withRunningBalance].reverse();

  // Filter transactions
  const filteredTransactions = displayTransactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recipientOrPayer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recordedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const totalMasuk = transactions
    .filter(t => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKeluar = transactions
    .filter(t => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalMasuk - totalKeluar;

  const handleExportLedgerCSV = () => {
    const rows: (string | number)[][] = [
      ['BUKU KAS UMUM (GENERAL LEDGER)'],
      ['Organisasi', config.name],
      ['Periode', config.period],
      ['Bendahara', config.treasurerName],
      [''],
      ['No', 'Tanggal', 'Kategori', 'Keterangan', 'Pemberi / Penerima', 'Kas Masuk (Debit)', 'Kas Keluar (Kredit)', 'Saldo Berjalan', 'Pencatat'],
    ];

    sortedChronological.forEach((tx, idx) => {
      rows.push([
        idx + 1,
        tx.date,
        tx.category,
        tx.description,
        tx.recipientOrPayer,
        tx.type === 'masuk' ? tx.amount : 0,
        tx.type === 'keluar' ? tx.amount : 0,
        tx.type === 'masuk' ? tx.amount : -tx.amount, // running balance in final column
        tx.recordedBy,
      ]);
    });

    rows.push(['']);
    rows.push(['Total Kas Masuk', totalMasuk]);
    rows.push(['Total Kas Keluar', totalKeluar]);
    rows.push(['Saldo Kas Bersih', currentBalance]);

    exportToCSV(`Buku_Kas_Umum_${config.shortName}_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const handleCreateRab = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseInt(rabBudgetStr.replace(/[^0-9]/g, ''), 10) || 0;
    if (!rabProker.trim() || budgetNum <= 0) return;

    onAddBudgetPlan({
      prokerName: rabProker.trim(),
      division: rabDivision as any,
      allocatedBudget: budgetNum,
      realizedBudget: 0,
      date: rabDate,
      status: 'Direncanakan',
    });

    setIsRabModalOpen(false);
    setRabProker('');
    setRabBudgetStr('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Buku Kas & Keuangan Organisasi</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Transparan & Akuntabel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kas masuk & keluar, alokasi pos anggaran, realisasi RAB, dan cetak bukti transaksi kwitansi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenAddTransaction('keluar')}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors border border-rose-200"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Catat Pengeluaran</span>
          </button>

          <button
            onClick={() => onOpenAddTransaction('masuk')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Catat Pemasukan</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Kas Bersih</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{formatRupiah(currentBalance)}</p>
          <p className="text-2xs text-slate-500 mt-1">
            Kas saat ini tersedia di rekening {config.bankName}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kas Masuk (Debit)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">+{formatRupiah(totalMasuk)}</p>
          <p className="text-2xs text-slate-500 mt-1">
            Dari {transactions.filter(t => t.type === 'masuk').length} catatan penerimaan kas
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kas Keluar (Kredit)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2 font-mono">-{formatRupiah(totalKeluar)}</p>
          <p className="text-2xs text-slate-500 mt-1">
            Untuk {transactions.filter(t => t.type === 'keluar').length} pengeluaran & operasional
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Buku Kas vs RAB */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'ledger'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Buku Kas Umum (General Ledger)</span>
        </button>

        <button
          onClick={() => setActiveTab('rab')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'rab'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>RAB & Realisasi Anggaran ({budgetPlans.length} Proker)</span>
        </button>
      </div>

      {/* TAB 1: BUKU KAS UMUM */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Action Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi, penerima, keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filters & Export */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Arus (Masuk & Keluar)</option>
                <option value="masuk">Kas Masuk Saja</option>
                <option value="keluar">Kas Keluar Saja</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kategori Pos</option>
                <option value="Iuran Kas Anggota">Iuran Kas Anggota</option>
                <option value="Sponsorship">Sponsorship</option>
                <option value="Dana Usaha (Danus)">Dana Usaha (Danus)</option>
                <option value="Hibah / Donasi Kampus">Hibah / Donasi Kampus</option>
                <option value="Konsumsi Rapat / Acara">Konsumsi Rapat / Acara</option>
                <option value="Perlengkapan & Logistik">Perlengkapan & Logistik</option>
                <option value="Sewa Tempat & Sound System">Sewa Tempat & Sound</option>
                <option value="Publikasi, Banner & Medkraf">Publikasi & Medkraf</option>
                <option value="Hadiah, Plakat & Sertifikat">Hadiah & Plakat</option>
                <option value="Transportasi & Operasional">Operasional</option>
              </select>

              <button
                onClick={handleExportLedgerCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors border border-slate-200"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>CSV</span>
              </button>

              <button
                onClick={onPrintReport}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors border border-slate-200"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak</span>
              </button>
            </div>

          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase text-2xs tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori & Keterangan</th>
                  <th className="py-3 px-4 hidden md:table-cell">Pihak Terkait</th>
                  <th className="py-3 px-4 text-right">Kas Masuk (Debit)</th>
                  <th className="py-3 px-4 text-right">Kas Keluar (Kredit)</th>
                  <th className="py-3 px-4 text-right font-mono">Saldo Kas</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada catatan transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600 text-xs">
                        {formatDateIndo(tx.date)}
                        <span className="block text-2xs text-slate-400">Oleh: {tx.recordedBy}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                            {tx.category}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm mt-0.5">
                          {tx.description}
                        </p>
                      </td>

                      <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-600">
                        {tx.recipientOrPayer}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {tx.type === 'masuk' ? `+${formatRupiah(tx.amount)}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                        {tx.type === 'keluar' ? `-${formatRupiah(tx.amount)}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(tx.runningBalance || 0)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onViewReceipt(tx)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1 mx-auto border border-indigo-200"
                          title="Lihat Bukti Kwitansi"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Kwitansi</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: RAB & REALISASI ANGGARAN */}
      {activeTab === 'rab' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Rancangan Anggaran Biaya (RAB) Program Kerja</h2>
              <p className="text-xs text-slate-500">Pagu anggaran yang disetujui vs realisasi penyerapan dana divisi</p>
            </div>
            <button
              onClick={() => setIsRabModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Rencana Anggaran (RAB)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetPlans.map((plan) => {
              const percentage = plan.allocatedBudget > 0
                ? Math.min(100, Math.round((plan.realizedBudget / plan.allocatedBudget) * 100))
                : 0;
              const remaining = plan.allocatedBudget - plan.realizedBudget;

              return (
                <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-2xs font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {plan.division}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                        plan.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : plan.status === 'Berjalan' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {plan.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mt-2">{plan.prokerName}</h3>
                    <p className="text-2xs text-slate-400 mt-0.5">Target Pelaksanaan: {formatDateIndo(plan.date)}</p>

                    <div className="grid grid-cols-3 gap-2 my-4 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-2xs font-semibold text-slate-500 uppercase">Pagu RAB</span>
                        <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{formatRupiah(plan.allocatedBudget)}</p>
                      </div>
                      <div className="bg-rose-50 p-2 rounded-xl">
                        <span className="text-2xs font-semibold text-rose-600 uppercase">Realisasi</span>
                        <p className="text-xs font-bold text-rose-700 font-mono mt-0.5">{formatRupiah(plan.realizedBudget)}</p>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-xl">
                        <span className="text-2xs font-semibold text-emerald-600 uppercase">Sisa Pagu</span>
                        <p className="text-xs font-bold text-emerald-700 font-mono mt-0.5">{formatRupiah(remaining)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-2xs font-semibold text-slate-600 mb-1">
                      <span>Penyerapan Anggaran:</span>
                      <span className="font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          percentage > 90 ? 'bg-rose-500' : percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE RAB MODAL */}
      {isRabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">Tambah Pos Anggaran (RAB Proker)</h2>
              <button onClick={() => setIsRabModalOpen(false)} className="text-white hover:bg-white/20 p-1 rounded">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRab} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Program Kerja / Proker *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Malam Keakraban / Informatics Expo 2026"
                  value={rabProker}
                  onChange={(e) => setRabProker(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Divisi Penanggung Jawab *</label>
                <select
                  value={rabDivision}
                  onChange={(e) => setRabDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Badan Pengurus Harian (BPH)">BPH</option>
                  <option value="Divisi Acara & Program">Divisi Acara & Program</option>
                  <option value="Divisi Humas & Eksternal">Divisi Humas & Eksternal</option>
                  <option value="Divisi Media & Kreatif">Divisi Media & Kreatif</option>
                  <option value="Divisi Logistik & Perlengkapan">Divisi Logistik & Perlengkapan</option>
                  <option value="Divisi Danus (Dana Usaha)">Divisi Danus (Dana Usaha)</option>
                  <option value="Divisi Litbang & Keilmuan">Divisi Litbang & Keilmuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pagu Anggaran Disetujui (Rp) *</label>
                <input
                  type="text"
                  required
                  placeholder="0"
                  value={rabBudgetStr ? parseInt(rabBudgetStr.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={(e) => setRabBudgetStr(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  value={rabDate}
                  onChange={(e) => setRabDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRabModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Simpan RAB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
