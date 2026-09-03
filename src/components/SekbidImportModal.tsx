import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, UploadCloud, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SekbidMember } from '../types';

interface SekbidImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newMembers: SekbidMember[]) => Promise<void>;
}

interface ParsedSekbidRow {
  name: string;
  gradeClass: string;
  sekbidId: number;
  role: string;
  isValid: boolean;
  errorMessage?: string;
}

export const SekbidImportModal: React.FC<SekbidImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedSekbidRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate & Download Template Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      { NAMA: 'Budi Santoso', KELAS: 'XI MIPA 1', SEKBID: 1 },
      { NAMA: 'Siti Rahmawati', KELAS: 'X-2', SEKBID: 2 },
      { NAMA: 'Ahmad Fauzi', KELAS: 'XII IPS 1', SEKBID: 3 },
      { NAMA: 'Dini Lestari', KELAS: 'XI MIPA 3', SEKBID: 4 },
      { NAMA: 'Rian Hidayat', KELAS: 'X-5', SEKBID: 5 },
      { NAMA: 'Maya Putri', KELAS: 'XI IPS 2', SEKBID: 6 },
      { NAMA: 'Fikri Haikal', KELAS: 'XII MIPA 2', SEKBID: 7 },
      { NAMA: 'Nabila Zahrani', KELAS: 'X-1', SEKBID: 8 },
      { NAMA: 'Daffa Rizky', KELAS: 'XI MIPA 4', SEKBID: 9 },
      { NAMA: 'Karin Amelia', KELAS: 'XII IPS 3', SEKBID: 10 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PengurusSekbid');
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // NAMA
      { wch: 15 }, // KELAS
      { wch: 12 }, // SEKBID
    ];

    XLSX.writeFile(workbook, 'Template_Import_Pengurus_Sekbid.xlsx');
  };

  // Parse Uploaded Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadError(null);
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setUploadError('File Excel kosong atau tidak berisi data.');
          setParsedRows([]);
          setIsProcessing(false);
          return;
        }

        const rows: ParsedSekbidRow[] = rawJson.map((row, index) => {
          // Normalize Keys (Case insensitive matching)
          const keys = Object.keys(row);
          const findVal = (possibleKeys: string[]) => {
            const matchedKey = keys.find(k => possibleKeys.includes(k.trim().toUpperCase()));
            return matchedKey ? String(row[matchedKey]).trim() : '';
          };

          const name = findVal(['NAMA', 'NAMA LENGKAP', 'NAME', 'NAMA ANGGOTA']);
          const gradeClass = findVal(['KELAS', 'GRADE', 'CLASS', 'TINGKAT']);
          const sekbidRaw = findVal(['SEKBID', 'SEKBID ID', 'NO SEKBID', 'DIVISI SEKBID', 'SEKBID_ID']);
          const roleRaw = findVal(['JABATAN', 'ROLE', 'JABATAN SEKBID']);

          // Parse Sekbid Number (1-10)
          let sekbidNum = NaN;
          if (sekbidRaw) {
            const matches = sekbidRaw.match(/\d+/);
            if (matches) {
              sekbidNum = parseInt(matches[0], 10);
            }
          }

          let isValid = true;
          let errorMessage = '';

          if (!name) {
            isValid = false;
            errorMessage = 'Nama wajib diisi.';
          } else if (isNaN(sekbidNum) || sekbidNum < 1 || sekbidNum > 10) {
            isValid = false;
            errorMessage = `Sekbid harus berupa angka 1 s/d 10 (Ditemukan: "${sekbidRaw || '-'}")`;
          }

          return {
            name: name || `Baris ${index + 1}`,
            gradeClass: gradeClass || 'Umum',
            sekbidId: isNaN(sekbidNum) ? 1 : sekbidNum,
            role: roleRaw || 'Anggota',
            isValid,
            errorMessage,
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Failed to parse excel:', err);
        setUploadError(`Gagal membaca file Excel: ${err.message || 'Format file tidak didukung.'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit Valid Rows to Database
  const handleSaveImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada data valid yang dapat diimpor.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString().split('T')[0];
      const newMembers: SekbidMember[] = validRows.map((r, i) => ({
        id: `sekbid-m-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        sekbidId: r.sekbidId,
        name: r.name,
        nis: `NIS-${Math.floor(100000 + Math.random() * 900000)}`,
        role: r.role === 'Ketua Sekbid' || r.role === 'Wakil Ketua Sekbid' ? r.role : 'Anggota',
        gradeClass: r.gradeClass,
        phone: '',
        email: '',
        status: 'Aktif',
        joinedPeriod: '2026/2027',
      }));

      await onImport(newMembers);
      alert(`Berhasil mengimpor ${newMembers.length} pengurus Sekbid ke database NeonDB!`);
      onClose();
    } catch (err: any) {
      alert(`Gagal mengimpor data ke database: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Import Data Pengurus 10 Sekbid</h3>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Unggah file Excel dengan kolom <code className="bg-indigo-900/50 px-1.5 py-0.5 rounded text-yellow-300 font-mono">NAMA</code>, <code className="bg-indigo-900/50 px-1.5 py-0.5 rounded text-yellow-300 font-mono">KELAS</code>, & <code className="bg-indigo-900/50 px-1.5 py-0.5 rounded text-yellow-300 font-mono">SEKBID (1-10)</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Action Bar: Download Template & File Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs text-indigo-900 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>1. Unduh Template Excel</span>
                </h4>
                <p className="text-2xs text-slate-600 mt-1">
                  Gunakan format contoh dengan kolom NAMA, KELAS, dan SEKBID (angka 1 s/d 10).
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-2 px-3 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Unduh Template (.xlsx)</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  <span>2. Unggah File Excel / CSV</span>
                </h4>
                <p className="text-2xs text-slate-600 mt-1">
                  Pilih file .xlsx, .xls, atau .csv dari perangkat Anda.
                </p>
              </div>
              <label className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{fileName ? `Ganti File (${fileName})` : 'Pilih File Excel'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Upload Status / Error */}
          {isProcessing && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Membaca data file Excel...</span>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Hasil Pratinjau Import ({parsedRows.length} Baris)</span>
                </h4>
                <div className="flex items-center space-x-2 text-2xs font-semibold">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                    ✓ Valid: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                      ⚠ Invalid: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3 text-center">Sekbid (1-10)</th>
                      <th className="py-2.5 px-3">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3 font-medium text-slate-500 text-2xs">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{row.name}</td>
                        <td className="py-2 px-3 text-slate-600">{row.gradeClass}</td>
                        <td className="py-2 px-3 text-center font-bold">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-2xs ${
                            row.sekbidId >= 1 && row.sekbidId <= 10
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            Sekbid {row.sekbidId}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-2xs text-emerald-600 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Siap Impor</span>
                            </span>
                          ) : (
                            <span className="text-2xs text-rose-600 font-medium flex items-center space-x-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{row.errorMessage}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={validCount === 0 || isSaving}
            onClick={handleSaveImport}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              validCount > 0 && !isSaving
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan ke Database...' : `Simpan ${validCount} Data Pengurus Ke Database`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
