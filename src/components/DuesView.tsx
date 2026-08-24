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
  Building2
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
  onPayDues: (memberId: string, months: number[], paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet', notes?: string) => void;
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

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet'>('Transfer Bank');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Months array 1..12
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const currentMonth = 3; // March

  const getRecord = (memberId: string, month: number) => {
    return duesRecords.find(d => d.memberId === memberId && d.month === month && d.year === 2026);
  };

  const handleOpenPayment = (member: Member) => {
    setSelectedMember(member);
    // Find unpaids
    const unpaid = months.filter(m => {
      const rec = getRecord(member.id, m);
      return !rec || rec.status === 'belum';
    });
    setSelectedMonths(unpaid.slice(0, 1)); // preselect first unpaid
    setIsPayModalOpen(true);
  };

  const handleToggleMonth = (m: number) => {
    if (selectedMonths.includes(m)) {
      setSelectedMonths(selectedMonths.filter(x => x !== m));
    } else {
      setSelectedMonths([...selectedMonths, m].sort((a, b) => a - b));
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || selectedMonths.length === 0) return;

    onPayDues(selectedMember.id, selectedMonths, paymentMethod, paymentNotes.trim() || undefined);
    setIsPayModalOpen(false);
    setSelectedMember(null);
    setSelectedMonths([]);
  };

  // WhatsApp Reminder
  const handleSendWhatsAppReminder = (member: Member) => {
    const unpaidMonths = months.filter(m => {
      const rec = getRecord(member.id, m);
      return m <= currentMonth && (!rec || rec.status === 'belum');
    });

    if (unpaidMonths.length === 0) {
      alert(`Anggota ${member.name} tidak memiliki tunggakan iuran hingga bulan ini.`);
      return;
    }

    const monthNames = unpaidMonths.map(m => getMonthName(m)).join(', ');
    const totalDue = unpaidMonths.length * config.defaultMonthlyDue;

    const message = `Halo ${member.name} (${member.division})! 👋\n\nKami dari Bendahara ${config.shortName} (${config.period}) ingin mengingatkan perihal Iuran Kas Organisasi.\n\n📌 Rincian Tunggakan:\n• Bulan: ${monthNames}\n• Nominal Total: ${formatRupiah(totalDue)} (${formatRupiah(config.defaultMonthlyDue)}/bulan)\n\n💳 Pembayaran dapat ditransfer melalui:\n• ${config.bankName}: ${config.bankAccountNumber} (a.n ${config.bankAccountHolder})\n\nSetelah transfer, mohon kirimkan bukti pembayaran ya. Terima kasih atas partisipasinya! 🙏✨`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = member.phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleExportDuesCSV = () => {
    const rows: (string | number)[][] = [
      ['REKAPITULASI IURAN KAS ANGGOTA BULANAN (2026)'],
      ['Organisasi', config.name],
      ['Nominal Standar', formatRupiah(config.defaultMonthlyDue) + '/bulan'],
      ['Bendahara', config.treasurerName],
      [''],
      ['No', 'NIM', 'Nama Anggota', 'Divisi', ...months.map(m => getMonthName(m)), 'Total Terbayar', 'Sisa Tunggakan Q1'],
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

  // Calculate high-level summary
  const totalPaidSlots = duesRecords.filter(d => d.status === 'lunas').length;
  const totalExpectedQ1 = members.length * currentMonth;
  const paidSlotsQ1 = duesRecords.filter(d => d.month <= currentMonth && d.status === 'lunas').length;
  const totalCollectedAmount = totalPaidSlots * config.defaultMonthlyDue;
  const totalArrearsAmount = (totalExpectedQ1 - paidSlotsQ1) * config.defaultMonthlyDue;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Manajemen Iuran Kas Anggota</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {formatRupiah(config.defaultMonthlyDue)} / Bulan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Matriks status pembayaran iuran rutin pengurus, kwitansi digital resmi, dan pengingat otomatis WhatsApp.
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
            Dari total {totalPaidSlots} bulan terbayar sepanjang tahun
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tunggakan Q1 (Jan - Mar)</span>
          <p className="text-2xl font-black text-rose-700 mt-2 font-mono">{formatRupiah(totalArrearsAmount)}</p>
          <p className="text-2xs text-slate-500 mt-1">
            {totalExpectedQ1 - paidSlotsQ1} slot iuran belum terbayar
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kepatuhan Iuran Q1</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {Math.round((paidSlotsQ1 / (totalExpectedQ1 || 1)) * 100)}%
            </p>
            <span className="text-xs text-slate-500 font-semibold">({paidSlotsQ1}/{totalExpectedQ1})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full" 
              style={{ width: `${Math.round((paidSlotsQ1 / (totalExpectedQ1 || 1)) * 100)}%` }} 
            />
          </div>
        </div>
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
              <option value="all">Semua Divisi</option>
              <option value="Badan Pengurus Harian (BPH)">BPH</option>
              <option value="Divisi Acara & Program">Divisi Acara</option>
              <option value="Divisi Humas & Eksternal">Divisi Humas</option>
              <option value="Divisi Media & Kreatif">Divisi Medkraf</option>
              <option value="Divisi Logistik & Perlengkapan">Divisi Logistik</option>
              <option value="Divisi Danus (Dana Usaha)">Divisi Danus</option>
              <option value="Divisi Litbang & Keilmuan">Divisi Litbang</option>
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
                <th className="py-3 px-3 border-r border-slate-200">Divisi</th>
                {months.map((m) => (
                  <th key={m} className={`py-3 px-2 text-center border-r border-slate-200 ${m === currentMonth ? 'bg-indigo-50 text-indigo-800' : ''}`}>
                    {getMonthName(m).slice(0, 3)}
                  </th>
                ))}
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
                  let paidMonthsCount = 0;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {member.name}
                        <span className="block text-2xs text-slate-500 font-normal">{member.nim}</span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap text-2xs">
                        {member.division}
                      </td>

                      {/* 12 Months Cells */}
                      {months.map((m) => {
                        const rec = getRecord(member.id, m);
                        const isLunas = rec?.status === 'lunas';
                        if (isLunas) paidMonthsCount++;

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
                      })}

                      {/* Total Paid */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formatRupiah(paidMonthsCount * config.defaultMonthlyDue)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenPayment(member)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs rounded-lg transition-colors shadow-2xs"
                          >
                            + Bayar
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

      {/* PAYMENT MODAL */}
      {isPayModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <h2 className="text-base font-bold">Input Pembayaran Iuran Kas</h2>
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
                <p className="text-xs text-slate-500">{selectedMember.nim} • {selectedMember.division}</p>
              </div>

              {/* Select Months to Pay */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Bulan yang Ingin Dibayarkan:
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
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
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

              {/* Total Calculation */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-2xs text-emerald-800 font-bold uppercase">Total Tagihan ({selectedMonths.length} Bulan)</span>
                  <p className="text-lg font-black text-emerald-900 font-mono">
                    {formatRupiah(selectedMonths.length * config.defaultMonthlyDue)}
                  </p>
                </div>
                <div className="text-right text-2xs text-emerald-700">
                  <span>@ {formatRupiah(config.defaultMonthlyDue)}/bln</span>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="Transfer Bank">Transfer Bank ({config.bankName})</option>
                  <option value="QRIS / E-Wallet">QRIS / GoPay / OVO / Dana</option>
                  <option value="Tunai">Tunai / Kas Fisik</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Titip lewat bendahara 2 / transfer m-banking"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedMonths.length === 0}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition-all ${
                    selectedMonths.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Konfirmasi Lunas & Terbitkan Kwitansi
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
