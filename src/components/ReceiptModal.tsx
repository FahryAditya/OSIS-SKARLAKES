import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
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
  const description = customDetails?.description || (dueRecord ? `Pembayaran Iuran Kas Bulanan (${getMonthName(dueRecord.month)} ${dueRecord.year})` : 'Iuran Kas Organisasi');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Bukti Pembayaran / Kwitansi Resmi</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kwitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Receipt Document */}
        <div className="p-8 bg-white border-8 border-slate-100 m-2 rounded-xl text-slate-900">
          
          {/* Header Kop Kwitansi */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {config.logoUrl && (
                <img 
                  src={config.logoUrl} 
                  alt={`Logo ${config.shortName}`} 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0" 
                />
              )}
              <div>
                <h1 className="text-base font-extrabold tracking-tight uppercase text-slate-900">
                  {config.name}
                </h1>
                <p className="text-xs font-semibold text-indigo-700">{config.tagline}</p>
                <p className="text-2xs text-slate-500">{config.institution} • Periode {config.period}</p>
                <p className="text-2xs text-slate-500">{config.address}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-indigo-600 px-3 py-1 rounded-md text-xs font-bold font-mono text-indigo-900 bg-indigo-50">
                KWITANSI PEMBAYARAN
              </div>
              <p className="text-2xs text-slate-500 font-mono mt-1">No: {receiptNumber}</p>
            </div>
          </div>

          {/* Body Receipt Details */}
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 font-semibold text-slate-600">Telah Diterima Dari</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1 font-bold text-slate-900">{payerName} ({memberNim})</span>
            </div>

            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 font-semibold text-slate-600">Divisi / Jabatan</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1 text-slate-800">{division}</span>
            </div>

            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 font-semibold text-slate-600">Guna Membayar</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1 text-slate-800">{description}</span>
            </div>

            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 font-semibold text-slate-600">Metode Pembayaran</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1 text-slate-800">{paymentMethod}</span>
            </div>

            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 font-semibold text-slate-600">Tanggal Transaksi</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1 text-slate-800">{formatDateIndo(paymentDate)}</span>
            </div>

            {/* Total Highlight */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between my-4">
              <div>
                <p className="text-2xs uppercase tracking-wider text-slate-500 font-bold">Jumlah Total Diterima</p>
                <p className="text-lg font-extrabold text-emerald-700 font-mono">{formatRupiah(amount)}</p>
              </div>
              <div className="border-2 border-emerald-600 px-3 py-1 rounded-lg text-emerald-700 font-black text-xs uppercase tracking-widest bg-emerald-50 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>LUNAS</span>
              </div>
            </div>

          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-12">Penyetor,</p>
              <p className="font-bold underline text-slate-800">{payerName}</p>
              <p className="text-2xs text-slate-500">{memberNim !== '-' ? `NIM. ${memberNim}` : 'Anggota'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Bendahara Penerima,</p>
              <p className="font-bold underline text-slate-800">{config.treasurerName}</p>
              <p className="text-2xs text-slate-500">Bendahara {config.shortName}</p>
            </div>
          </div>

          <div className="mt-6 text-center text-2xs text-slate-400 font-mono">
            *** Dokumen tanda terima sah diterbitkan secara digital oleh {config.name} ***
          </div>

        </div>

      </div>
    </div>
  );
};
