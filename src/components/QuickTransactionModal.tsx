import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import { Transaction, TransactionType, TransactionCategory, AttendanceEvent } from '../types';
import { formatRupiah } from '../utils/formatters';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  events: AttendanceEvent[];
  defaultType?: TransactionType;
}

const CATEGORIES_MASUK: TransactionCategory[] = [
  'Iuran Kas Anggota',
  'Sponsorship',
  'Dana Usaha (Danus)',
  'Hibah / Donasi Kampus',
  'Lain-lain',
];

const CATEGORIES_KELUAR: TransactionCategory[] = [
  'Konsumsi Rapat / Acara',
  'Perlengkapan & Logistik',
  'Sewa Tempat & Sound System',
  'Publikasi, Banner & Medkraf',
  'Hadiah, Plakat & Sertifikat',
  'Transportasi & Operasional',
  'Lain-lain',
];

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  events,
  defaultType = 'masuk',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<TransactionCategory>(
    defaultType === 'masuk' ? 'Iuran Kas Anggota' : 'Konsumsi Rapat / Acara'
  );
  const [amountStr, setAmountStr] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [recipientOrPayer, setRecipientOrPayer] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('Bendahara');
  const [relatedEventId, setRelatedEventId] = useState<string>('');

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'masuk' ? 'Iuran Kas Anggota' : 'Konsumsi Rapat / Acara');
  };

  const amountNumber = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNumber <= 0 || !description.trim()) {
      alert('Mohon isi nominal dan deskripsi transaksi dengan benar.');
      return;
    }

    onSave({
      type,
      category,
      amount: amountNumber,
      date,
      description: description.trim(),
      recipientOrPayer: recipientOrPayer.trim() || (type === 'masuk' ? 'Pemberi Dana' : 'Penerima Pembayaran'),
      recordedBy: recordedBy.trim() || 'Bendahara',
      relatedEventId: relatedEventId || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          type === 'masuk' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <div className="flex items-center space-x-2">
            {type === 'masuk' ? (
              <div className="p-1.5 bg-white/20 rounded-lg">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-1.5 bg-white/20 rounded-lg">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold">
                {type === 'masuk' ? 'Catat Kas Masuk (Pemasukan)' : 'Catat Kas Keluar (Pengeluaran)'}
              </h2>
              <p className="text-xs opacity-80">Buku Kas Umum Organisasi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Toggle Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('masuk')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  type === 'masuk'
                    ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-500'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>Pemasukan (Kas Masuk)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('keluar')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  type === 'keluar'
                    ? 'bg-rose-50 text-rose-700 border-2 border-rose-500'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran (Kas Keluar)</span>
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal (Rp) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Rp</span>
                <input
                  type="text"
                  required
                  placeholder="0"
                  value={amountStr ? parseInt(amountStr.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {amountNumber > 0 && (
                <p className="text-2xs text-slate-500 mt-1 font-medium">
                  {formatRupiah(amountNumber)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Pos Kas *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {(type === 'masuk' ? CATEGORIES_MASUK : CATEGORIES_KELUAR).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Rincian Transaksi *
            </label>
            <textarea
              required
              rows={2}
              placeholder={type === 'masuk' ? 'Contoh: Iuran kas bulan Maret / Dana sponsor paket gold...' : 'Contoh: Pembelian konsumsi snack rapat pleno 20 kotak...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Recipient / Payer & Recorder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'masuk' ? 'Diterima Dari' : 'Dibayarkan Kepada'}
              </label>
              <input
                type="text"
                placeholder={type === 'masuk' ? 'Nama donatur / pihak' : 'Toko / vendor / person'}
                value={recipientOrPayer}
                onChange={(e) => setRecipientOrPayer(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pencatat / Penanggung Jawab
              </label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Related Event (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terkait Kegiatan / Sesi (Opsional)
            </label>
            <select
              value={relatedEventId}
              onChange={(e) => setRelatedEventId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Tidak Terikat Kegiatan Tertentu --</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.date})
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all flex items-center space-x-1.5 ${
                type === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Catatan Kas</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
