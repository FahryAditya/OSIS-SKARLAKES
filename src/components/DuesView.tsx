import React, { useState } from 'react';
import { 
  Coins, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Receipt, 
  FileSpreadsheet, 
  MessageSquareShare, 
  CreditCard,
  Check,
  X,
  Send,
  Building2,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  Member, 
  MonthlyDuesRecord, 
  OrganizationConfig, 
  DuesStatus 
} from '../types';
import { formatRupiah, getMonthName, exportToCSV } from '../utils/formatters';

interface DuesViewProps {
  members: Member[];
  duesRecords: MonthlyDuesRecord[];
  config: OrganizationConfig;
  onPayDues: (
    memberId: string, 
    months: number[], 
    paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet', 
    notes?: string,
    customAmount?: number,
    customLabel?: string,
    weeksToPay?: number[],
    selectedMonthForWeeks?: number
  ) => void;
  onViewReceipt: (dueRecord: MonthlyDuesRecord, member: Member) => void;
}

export const DuesView: React.FC<DuesViewProps> = ({
  members,
  duesRecords,
  config,
  onPayDues,
  onViewReceipt,
}) => {
  const [searchMember, setSearchMember] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  
  // Frequency View Mode: 'bulanan' | 'mingguan'
  const [viewMode, setViewMode] = useState<'bulanan' | 'mingguan'>(config.duesMode || 'mingguan');
  const [selectedMonthForWeekly, setSelectedMonthForWeekly] = useState<number>(3); // Default March (3)

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([3]);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([1]);
  const [payType, setPayType] = useState<'bulanan' | 'mingguan'>('mingguan');
  const [customAmountInput, setCustomAmountInput] = useState<number>(config.defaultWeeklyDue || 2500);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet'>('Transfer Bank');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Months array 1..12
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const weeksInMonth = [1, 2, 3, 4];
  const currentMonth = 3; // March

  const getRecord = (memberId: string, month: number) => {
    return duesRecords.find(d => d.memberId === memberId && d.month === month && (!d.week || d.week === 0) && d.year === 2026);
  };

  const getWeeklyRecord = (memberId: string, month: number, week: number) => {
    const wRec = duesRecords.find(d => d.memberId === memberId && d.month === month && d.week === week && d.year === 2026);
    if (wRec && wRec.status === 'lunas') return wRec;
    const mRec = getRecord(memberId, month);
    if (mRec && mRec.status === 'lunas') return mRec;
    return wRec || null;
  };

  const handleOpenPayment = (member: Member) => {
    setSelectedMember(member);
    if (viewMode === 'mingguan') {
      setPayType('mingguan');
      setCustomAmountInput(config.defaultWeeklyDue || 2500);
      setSelectedWeeks([1]);
      setSelectedMonths([selectedMonthForWeekly]);
    } else {
      setPayType('bulanan');
      setCustomAmountInput(config.defaultMonthlyDue || 10000);
      const unpaid = months.filter(m => {
        const rec = getRecord(member.id, m);
        return !rec || rec.status === 'belum';
      });
      setSelectedMonths(unpaid.slice(0, 1));
    }
    setIsPayModalOpen(true);
  };

  const handleToggleMonth = (m: number) => {
    if (selectedMonths.includes(m)) {
      const next = selectedMonths.filter(x => x !== m);
      setSelectedMonths(next);
      if (payType === 'bulanan') {
        setCustomAmountInput(next.length * (config.defaultMonthlyDue || 10000));
      }
    } else {
      const next = [...selectedMonths, m].sort((a, b) => a - b);
      setSelectedMonths(next);
      if (payType === 'bulanan') {
        setCustomAmountInput(next.length * (config.defaultMonthlyDue || 10000));
      }
    }
  };

  const handleToggleWeek = (w: number) => {
    if (selectedWeeks.includes(w)) {
      const next = selectedWeeks.filter(x => x !== w);
      setSelectedWeeks(next);
      setCustomAmountInput(next.length * (config.defaultWeeklyDue || 2500));
    } else {
      const next = [...selectedWeeks, w].sort((a, b) => a - b);
      setSelectedWeeks(next);
      setCustomAmountInput(next.length * (config.defaultWeeklyDue || 2500));
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const amountToSave = customAmountInput > 0 
      ? customAmountInput 
      : payType === 'mingguan' 
        ? selectedWeeks.length * (config.defaultWeeklyDue || 2500)
        : selectedMonths.length * (config.defaultMonthlyDue || 10000);

    let customLabel = '';
    if (payType === 'mingguan') {
      const mName = getMonthName(selectedMonthForWeekly);
      const wStr = selectedWeeks.map(w => `Mgg ${w}`).join(', ');
      customLabel = `Iuran Mingguan (${wStr} - ${mName})`;
    } else {
      const mNames = selectedMonths.map(m => getMonthName(m)).join(', ');
      customLabel = `Iuran Bulanan (${mNames})`;
    }

    if (payType === 'mingguan') {
      onPayDues(
        selectedMember.id, 
        selectedMonths, 
        paymentMethod, 
        paymentNotes.trim() || undefined,
        amountToSave,
        customLabel,
        selectedWeeks,
        selectedMonthForWeekly
      );
    } else {
      onPayDues(
        selectedMember.id, 
        selectedMonths, 
        paymentMethod, 
        paymentNotes.trim() || undefined,
        amountToSave,
        customLabel
      );
    }

    setIsPayModalOpen(false);
    setSelectedMember(null);
    setSelectedMonths([3]);
    setSelectedWeeks([1]);
  };

  // WhatsApp Reminder
  const handleSendWhatsAppReminder = (member: Member) => {
    const unpaidMonths = months.filter(m => {
      const rec = getRecord(member.id, m);
      return m <= currentMonth && (!rec || rec.status === 'belum');
    });

    if (unpaidMonths.length === 0) {
      alert(`Anggota ${member.name} tidak memiliki tunggakan iuran.`);
      return;
    }

    const monthNames = unpaidMonths.map(m => getMonthName(m)).join(', ');
    const totalDue = unpaidMonths.length * (config.defaultMonthlyDue || 10000);

    const message = `Halo ${member.name} (${member.division})! 👋\n\nKami dari Bendahara ${config.shortName} (${config.period}) ingin mengingatkan perihal Iuran Kas Organisasi.\n\n📌 Rincian Tunggakan:\n• Periode: ${monthNames}\n• Nominal Tagihan: ${formatRupiah(totalDue)} (Dapat dicicil mingguan @ ${formatRupiah(config.defaultWeeklyDue || 2500)}/minggu)\n\n💳 Pembayaran dapat ditransfer melalui:\n• ${config.bankName}: ${config.bankAccountNumber} (a.n ${config.bankAccountHolder})\n\nSetelah transfer, mohon kirimkan bukti pembayaran ya. Terima kasih! 🙏✨`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = member.phone ? member.phone.replace(/^0/, '62').replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleExportDuesCSV = () => {
    const rows: (string | number)[][] = [
      ['REKAPITULASI IURAN KAS ANGGOTA BULANAN & MINGGUAN (2026)'],
      ['Organisasi', config.name],
      ['Nominal Standar Bulanan', formatRupiah(config.defaultMonthlyDue) + '/bulan'],
      ['Nominal Standar Mingguan', formatRupiah(config.defaultWeeklyDue || 2500) + '/minggu'],
      ['Bendahara', config.treasurerName],
      [''],
      ['No', 'NIM', 'Nama Anggota', 'Sekbid', ...months.map(m => getMonthName(m)), 'Total Terbayar', 'Sisa Tunggakan Q1'],
    ];

    members.forEach((m, idx) => {
      let paidCount = 0;
      let unpaidQ1Count = 0;
      const row: (string | number)[] = [idx + 1, m.nim, m.name, m.division];

      months.forEach(month => {
        const rec = getRecord(m.id, month);
        if (rec?.status === 'lunas') {
          paidCount++;
          row.push('LUNAS');
        } else {
          if (month <= currentMonth) unpaidQ1Count++;
          row.push('BELUM');
        }
      });

      row.push(formatRupiah(paidCount * config.defaultMonthlyDue));
      row.push(formatRupiah(unpaidQ1Count * config.defaultMonthlyDue));
      rows.push(row);
    });

    exportToCSV(`Rekapitulasi_Iuran_Kas_${config.shortName}_2026`, rows);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.nim.includes(searchMember);
    const matchesDiv = divisionFilter === 'all' || m.division === divisionFilter;

    if (statusFilter === 'all') return matchesSearch && matchesDiv;

    const hasUnpaidQ1 = months.some(month => {
      const rec = getRecord(m.id, month);
      return month <= currentMonth && (!rec || rec.status === 'belum');
    });

    if (statusFilter === 'unpaid') return matchesSearch && matchesDiv && hasUnpaidQ1;
    if (statusFilter === 'paid') return matchesSearch && matchesDiv && !hasUnpaidQ1;

    return matchesSearch && matchesDiv;
  });

  // Dynamic global dues statistics calculated directly from database records
  const paidRecords = duesRecords.filter(r => r.status === 'lunas');
  const totalCollectedAmount = paidRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const totalExpectedQ1 = members.length * 3;
  let paidSlotsQ1 = 0;
  members.forEach(m => {
    for (let month = 1; month <= 3; month++) {
      const mRec = getRecord(m.id, month);
      if (mRec?.status === 'lunas') {
        paidSlotsQ1++;
      } else {
        let paidWeeksCount = 0;
        for (let w = 1; w <= 4; w++) {
          const wRec = duesRecords.find(d => d.memberId === m.id && d.month === month && d.week === w && d.year === 2026 && d.status === 'lunas');
          if (wRec) paidWeeksCount++;
        }
        if (paidWeeksCount >= 4) {
          paidSlotsQ1++;
        } else if (paidWeeksCount > 0) {
          paidSlotsQ1 += paidWeeksCount / 4;
        }
      }
    }
  });

  const unpaidSlotsQ1 = Math.max(0, totalExpectedQ1 - Math.floor(paidSlotsQ1));
  const unpaidRecordsQ1 = duesRecords.filter(r => r.month <= 3 && r.status === 'belum' && (!r.week || r.week === 0));
  const totalArrearsAmount = unpaidRecordsQ1.length > 0 
    ? unpaidRecordsQ1.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    : unpaidSlotsQ1 * (config.defaultMonthlyDue || 10000);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Iuran Kas Anggota</h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-2xs rounded-full uppercase tracking-wider">
              {formatRupiah(config.defaultWeeklyDue || 2500)} / Mgg &bull; {formatRupiah(config.defaultMonthlyDue)} / Bln
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Matriks status pembayaran kas rutin pengurus (Mode Mingguan & Bulanan), kwitansi digital resmi, dan nominal fleksibel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportDuesCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Matriks CSV</span>
          </button>
        </div>
      </div>

      {/* Dues Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Iuran Terkumpul</span>
          <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">{formatRupiah(totalCollectedAmount)}</p>
          <p className="text-2xs text-slate-500 mt-1">
            Dari {paidRecords.length} catatan pembayaran kas terdaftar
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tunggakan Q1 (Jan - Mar)</span>
          <p className="text-2xl font-black text-rose-700 mt-2 font-mono">{formatRupiah(totalArrearsAmount)}</p>
          <p className="text-2xs text-slate-500 mt-1">
            {unpaidSlotsQ1} slot iuran belum terbayar
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kepatuhan Iuran Q1</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {totalExpectedQ1 > 0 ? Math.round((paidSlotsQ1 / totalExpectedQ1) * 100) : 100}%
            </p>
            <span className="text-xs text-slate-500 font-semibold">({Math.floor(paidSlotsQ1)}/{totalExpectedQ1})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full" 
              style={{ width: `${totalExpectedQ1 > 0 ? Math.round((paidSlotsQ1 / totalExpectedQ1) * 100) : 100}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setViewMode('mingguan')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              viewMode === 'mingguan'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mode Bayar Mingguan (W1 - W4)</span>
          </button>

          <button
            onClick={() => setViewMode('bulanan')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              viewMode === 'bulanan'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mode Bayar Bulanan (Jan - Des)</span>
          </button>
        </div>

        {viewMode === 'mingguan' && (
          <div className="flex items-center space-x-2 px-2">
            <span className="text-2xs font-bold text-slate-500 uppercase">Pilih Bulan:</span>
            <select
              value={selectedMonthForWeekly}
              onChange={(e) => setSelectedMonthForWeekly(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
            >
              {months.map(m => (
                <option key={m} value={m}>
                  {getMonthName(m)} 2026 {m === currentMonth ? '(Bulan Ini)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter and Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Search & Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama anggota atau NIM..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Sekbid</option>
              <option value="Badan Pengurus Harian (BPH)">BPH</option>
              <option value="Sekbid 1 (Keimanan & Ketakwaan)">Sekbid 1</option>
              <option value="Sekbid 2 (Budi Pekerti & Akhlak Mulia)">Sekbid 2</option>
              <option value="Sekbid 3 (Bela Negara & Wawasan Kebangsaan)">Sekbid 3</option>
              <option value="Sekbid 4 (Akademik, Seni & Olahraga)">Sekbid 4</option>
              <option value="Sekbid 5 (Demokrasi & Lingkungan Hidup)">Sekbid 5</option>
              <option value="Sekbid 6 (Kreativitas & Kewirausahaan)">Sekbid 6</option>
              <option value="Sekbid 7 (Kesehatan Jasmani & Gizi)">Sekbid 7</option>
              <option value="Sekbid 8 (Sastra & Budaya)">Sekbid 8</option>
              <option value="Sekbid 9 (TIK & Publikasi Media)">Sekbid 9</option>
              <option value="Sekbid 10 (Komunikasi Bahasa Asing)">Sekbid 10</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="unpaid">Menunggak Q1</option>
              <option value="paid">Lunas Q1</option>
            </select>
          </div>

        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-2xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 border-r border-slate-200">Anggota</th>
                <th className="py-3 px-3 border-r border-slate-200">Sekbid</th>
                
                {/* Headers based on View Mode */}
                {viewMode === 'bulanan' ? (
                  months.map((m) => (
                    <th key={m} className={`py-3 px-2 text-center border-r border-slate-200 ${m === currentMonth ? 'bg-indigo-50 text-indigo-800' : ''}`}>
                      {getMonthName(m).slice(0, 3)}
                    </th>
                  ))
                ) : (
                  weeksInMonth.map((w) => (
                    <th key={w} className="py-3 px-3 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-900 font-black">
                      Minggu {w} ({getMonthName(selectedMonthForWeekly).slice(0, 3)})
                    </th>
                  ))
                )}

                <th className="py-3 px-3 text-center border-r border-slate-200">Terbayar</th>
                <th className="py-3 px-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada anggota ditemukan
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const memberPaidTotal = duesRecords
                    .filter(r => r.memberId === member.id && r.status === 'lunas')
                    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {member.name}
                        <span className="block text-2xs text-slate-500 font-normal">{member.nim}</span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap text-2xs">
                        {member.division}
                      </td>

                      {/* CELLS BASED ON VIEW MODE */}
                      {viewMode === 'bulanan' ? (
                        months.map((m) => {
                          const rec = getRecord(member.id, m);
                          const isLunas = rec?.status === 'lunas';

                          return (
                            <td key={m} className={`py-2 px-1 text-center border-r border-slate-200 ${m === currentMonth ? 'bg-indigo-50/40' : ''}`}>
                              {isLunas ? (
                                <button
                                  onClick={() => onViewReceipt(rec, member)}
                                  title={`Lunas (${rec.paymentMethod || 'Kas'}). Klik lihat kwitansi.`}
                                  className="w-6 h-6 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-2xs inline-flex items-center justify-center transition-colors shadow-2xs"
                                >
                                  ✓
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setSelectedMonths([m]);
                                    setPayType('bulanan');
                                    setCustomAmountInput(config.defaultMonthlyDue || 10000);
                                    setIsPayModalOpen(true);
                                  }}
                                  title="Klik untuk bayar bulan ini"
                                  className={`w-6 h-6 rounded-md font-bold text-2xs inline-flex items-center justify-center transition-colors ${
                                    m <= currentMonth
                                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                                  }`}
                                >
                                  {m <= currentMonth ? '!' : '-'}
                                </button>
                              )}
                            </td>
                          );
                        })
                      ) : (
                        weeksInMonth.map((w) => {
                          const wRec = getWeeklyRecord(member.id, selectedMonthForWeekly, w);
                          const isWeekLunas = wRec?.status === 'lunas';

                          return (
                            <td key={w} className="py-2 px-2 text-center border-r border-slate-200 bg-slate-50/30">
                              {isWeekLunas ? (
                                <button
                                  onClick={() => onViewReceipt(wRec, member)}
                                  title={`Minggu ${w} Lunas (${wRec.paymentMethod || 'Kas'}). Klik lihat kwitansi.`}
                                  className="inline-flex items-center px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-3xs rounded-md transition-colors shadow-2xs"
                                >
                                  ✓ Mgg {w}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setSelectedMonthForWeekly(selectedMonthForWeekly);
                                    setSelectedWeeks([w]);
                                    setPayType('mingguan');
                                    setCustomAmountInput(config.defaultWeeklyDue || 2500);
                                    setIsPayModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-3xs rounded-md transition-colors"
                                >
                                  + Bayar
                                </button>
                              )}
                            </td>
                          );
                        })
                      )}

                      {/* Total Paid */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formatRupiah(memberPaidTotal)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenPayment(member)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs rounded-lg transition-colors shadow-2xs"
                          >
                            + Bayar Kas
                          </button>
                          <button
                            onClick={() => handleSendWhatsAppReminder(member)}
                            title="Kirim pengingat tagihan via WhatsApp"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                          >
                            <MessageSquareShare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center space-x-3">
            <span className="font-bold">Keterangan:</span>
            <span className="flex items-center"><span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold text-2xs inline-flex items-center justify-center mr-1">✓</span> Lunas (Klik utk Kwitansi)</span>
            <span className="flex items-center"><span className="w-4 h-4 rounded bg-rose-100 text-rose-700 font-bold text-2xs inline-flex items-center justify-center mr-1">!</span> Menunggak</span>
            <span className="flex items-center"><span className="w-4 h-4 rounded bg-slate-100 text-slate-400 font-bold text-2xs inline-flex items-center justify-center mr-1">-</span> Belum Jatuh Tempo</span>
          </div>
          <p className="text-2xs text-slate-400">
            Total {members.length} anggota tercatat
          </p>
        </div>

      </div>

      {/* PAYMENT MODAL WITH CUSTOM NOMINAL SUPPORT */}
      {isPayModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-200" />
                <h2 className="text-base font-bold">Input Pembayaran Kas (Fleksibel)</h2>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 rounded hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              
              {/* Member Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p className="text-2xs font-bold text-slate-500 uppercase">Anggota Penyetor</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedMember.name}</p>
                <p className="text-xs text-slate-500">{selectedMember.nim} &bull; {selectedMember.division}</p>
              </div>

              {/* Pay Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipe Pembayaran Kas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayType('mingguan');
                      setCustomAmountInput(config.defaultWeeklyDue || 2500);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                      payType === 'mingguan'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mode Mingguan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayType('bulanan');
                      setCustomAmountInput(config.defaultMonthlyDue || 10000);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                      payType === 'bulanan'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Mode Bulanan</span>
                  </button>
                </div>
              </div>

              {/* Week or Month Selection */}
              {payType === 'mingguan' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilih Minggu & Bulan Pembayaran:
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={selectedMonthForWeekly}
                      onChange={(e) => setSelectedMonthForWeekly(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      {months.map(m => (
                        <option key={m} value={m}>Bulan: {getMonthName(m)} 2026</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {weeksInMonth.map((w) => {
                      const isSelected = selectedWeeks.includes(w);
                      return (
                        <button
                          type="button"
                          key={w}
                          onClick={() => handleToggleWeek(w)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Minggu {w}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilih Bulan Pembayaran:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {months.map((m) => {
                      const isAlreadyPaid = getRecord(selectedMember.id, m)?.status === 'lunas';
                      const isSelected = selectedMonths.includes(m);

                      return (
                        <button
                          type="button"
                          key={m}
                          disabled={isAlreadyPaid}
                          onClick={() => handleToggleMonth(m)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                            isAlreadyPaid
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed opacity-50'
                              : isSelected
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {getMonthName(m).slice(0, 3)}
                          {isAlreadyPaid && <span className="block text-3xs font-normal">Lunas</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Editable Custom Nominal Input */}
              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 space-y-2">
                <label className="block text-xs font-extrabold text-indigo-950 flex items-center justify-between">
                  <span>Nominal Pembayaran (Rp) &bull; Bebas Ditentukan</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-indigo-700">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-indigo-300 rounded-xl text-base font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
                
                {/* 1-Click Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCustomAmountInput(2500)}
                    className="px-2.5 py-1 text-2xs font-bold bg-white hover:bg-indigo-600 hover:text-white text-indigo-800 rounded-lg transition-colors border border-indigo-200 shadow-2xs"
                  >
                    + Rp 2.500 (1 Mgg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAmountInput(5000)}
                    className="px-2.5 py-1 text-2xs font-bold bg-white hover:bg-indigo-600 hover:text-white text-indigo-800 rounded-lg transition-colors border border-indigo-200 shadow-2xs"
                  >
                    + Rp 5.000 (2 Mgg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAmountInput(10000)}
                    className="px-2.5 py-1 text-2xs font-bold bg-white hover:bg-indigo-600 hover:text-white text-indigo-800 rounded-lg transition-colors border border-indigo-200 shadow-2xs"
                  >
                    + Rp 10.000 (1 Bln)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAmountInput(20000)}
                    className="px-2.5 py-1 text-2xs font-bold bg-white hover:bg-indigo-600 hover:text-white text-indigo-800 rounded-lg transition-colors border border-indigo-200 shadow-2xs"
                  >
                    + Rp 20.000 (2 Bln)
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                >
                  <option value="Transfer Bank">Transfer Bank ({config.bankName})</option>
                  <option value="QRIS / E-Wallet">QRIS / GoPay / OVO / Dana</option>
                  <option value="Tunai">Tunai / Kas Fisik Bendahara</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Titip iuran minggu 1 & 2 via m-banking"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={customAmountInput <= 0}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${
                    customAmountInput > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Konfirmasi Lunas ({formatRupiah(customAmountInput)})
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
