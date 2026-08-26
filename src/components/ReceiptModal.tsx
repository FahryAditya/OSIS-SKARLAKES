import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { OrganizationConfig, MonthlyDuesRecord, Member } from '../types';
import { formatRupiah, formatDateIndo, getMonthName } from '../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueRecord?: MonthlyDuesRecord | null;
  member?: Member | null;
  config: OrganizationConfig;
  customDetails?: {
    receiptNumber: string;
    payerName: string;
    description: string;
    amount: number;
    date: string;
    paymentMethod: string;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  dueRecord,
  member,
  config,
  customDetails,
}) => {
  if (!isOpen) return null;

  const receiptNumber = customDetails?.receiptNumber || dueRecord?.receiptNumber || `KAS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const payerName = customDetails?.payerName || member?.name || 'Anggota Organisasi';
  const memberNim = member?.nim || '-';
  const division = member?.division || '-';
  const amount = customDetails?.amount || dueRecord?.amount || config.defaultMonthlyDue;
  const paymentDate = customDetails?.date || dueRecord?.paymentDate || new Date().toISOString().split('T')[0];
  const paymentMethod = customDetails?.paymentMethod || dueRecord?.paymentMethod || 'Transfer / Tunai';
  const description = customDetails?.description || (dueRecord ? `Pembayaran Iuran Kas (${getMonthName(dueRecord.month)} ${dueRecord.year})` : 'Iuran Kas Organisasi');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs sm:text-sm">Kwitansi Pembayaran Kas</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact Digital Receipt Card */}
        <div className="p-5 bg-white text-slate-900 space-y-4">
          
          {/* Header Kop Kwitansi Sederhana */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-3">
              <img 
                src={config.logoUrl || '/logo.png'} 
                alt={`Logo ${config.shortName}`} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0" 
              />
              <div>
                <h1 className="text-xs font-black tracking-tight uppercase text-slate-900 leading-snug">
                  {config.shortName || config.name}
                </h1>
                <p className="text-3xs text-slate-500 font-medium">Periode {config.period}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-3xs font-extrabold font-mono text-indigo-900 block">
                BUKTI RESMI
              </span>
              <p className="text-3xs text-slate-400 font-mono mt-0.5">#{receiptNumber}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Penyetor</span>
              <span className="font-bold text-slate-900 text-right">{payerName}</span>
            </div>

            {memberNim !== '-' && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">NIM / Sekbid</span>
                <span className="text-slate-800 font-medium text-right">{memberNim} &bull; {division}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Keterangan</span>
              <span className="text-slate-800 font-medium text-right max-w-[200px] truncate">{description}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Metode</span>
              <span className="text-slate-800 font-semibold text-right">{paymentMethod}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tanggal</span>
              <span className="text-slate-800 font-medium text-right">{formatDateIndo(paymentDate)}</span>
            </div>
          </div>

          {/* Amount Badge Banner */}
          <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-3xs uppercase tracking-wider text-emerald-800 font-bold">Total Pembayaran</p>
              <p className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5">{formatRupiah(amount)}</p>
            </div>
            <div className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-wider flex items-center space-x-1 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>LUNAS</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 text-center text-xs gap-2">
            <div>
              <p className="text-3xs text-slate-400 mb-6">Penyetor,</p>
              <p className="font-bold text-slate-800 text-2xs truncate">{payerName}</p>
            </div>
            <div>
              <p className="text-3xs text-slate-400 mb-6">Bendahara,</p>
              <p className="font-bold text-slate-800 text-2xs truncate">{config.treasurerName || 'Bendahara OSIS'}</p>
            </div>
          </div>

          <div className="text-center text-3xs text-slate-400 font-mono pt-1">
            Diterbitkan secara digital oleh {config.shortName || 'OSIS'}
          </div>

        </div>

      </div>
    </div>
  );
};
