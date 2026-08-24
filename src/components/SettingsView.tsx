import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { OrganizationConfig } from '../types';

interface SettingsViewProps {
  config: OrganizationConfig;
  onUpdateConfig: (updated: OrganizationConfig) => void;
  onExportAllData: () => void;
  onImportData: (jsonData: string) => void;
  onResetDemoData: () => void;
  onOpenGoogleSheetsSync: () => void;
  isGoogleSheetsConnected: boolean;
  connectedSheetTitle?: string;
  connectedSheetUrl?: string;
  lastSyncedAt?: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  onExportAllData,
  onImportData,
  onResetDemoData,
  onOpenGoogleSheetsSync,
  isGoogleSheetsConnected,
  connectedSheetTitle,
  connectedSheetUrl,
  lastSyncedAt,
}) => {
  const [formData, setFormData] = useState<OrganizationConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportData(content);
        alert('Data organisasi berhasil dipulihkan!');
      } catch {
        alert('File JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-black text-slate-900">Pengaturan Organisasi & Database</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan profil organisasi, struktur penandatangan dokumen resmi, rekening bank kas, integrasi database Google Sheets, serta cadangan data.
        </p>
      </div>

      {/* Google Sheets Database Card in Settings */}
      <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-md border border-emerald-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Integrasi Database Google Sheets</h2>
                {isGoogleSheetsConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Aktif Terhubung
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Belum Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Jadikan Google Spreadsheet sebagai penyimpanan database cloud organisasi yang dapat diedit bersama secara real-time.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-settings-open-sheets"
            onClick={onOpenGoogleSheetsSync}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{isGoogleSheetsConnected ? 'Kelola Database Sheets' : 'Hubungkan Google Sheets'}</span>
          </button>
        </div>

        {isGoogleSheetsConnected && (
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-slate-300 font-medium truncate max-w-xs">{connectedSheetTitle}</span>
              {connectedSheetUrl && (
                <a 
                  href={connectedSheetUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center text-2xs font-bold"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
            {lastSyncedAt && (
              <span className="text-2xs text-slate-400">
                Terakhir sinkron: {new Date(lastSyncedAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
          <span className="font-bold">Pengaturan organisasi berhasil disimpan!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Section 1: Profil Organisasi */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Identitas & Profil Organisasi</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Organisasi *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Singkatan / Kode Organisasi *</label>
              <input
                type="text"
                required
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline / Nama Kabinet</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Periode Kepengurusan *</label>
              <input
                type="text"
                required
                placeholder="2026 / 2027"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Institusi / Fakultas / Wilayah</label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Sekretariat</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">URL Logo Resmi Organisasi</label>
              <div className="flex items-center space-x-3">
                {formData.logoUrl && (
                  <img 
                    src={formData.logoUrl} 
                    alt="Preview Logo" 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0 bg-white"
                  />
                )}
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs"
                />
              </div>
              <p className="text-2xs text-slate-400 mt-1">Logo ini akan disematkan di navbar, kop kwitansi, LPJ resmi, portal presensi, dan dashboard.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Pejabat Penandatangan Dokumen Resmi */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            Penanggung Jawab Dokumen & Tanda Tangan Resmi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Ketua Umum *</label>
              <input
                type="text"
                required
                value={formData.leaderName}
                onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Sekretaris Umum *</label>
              <input
                type="text"
                required
                value={formData.secretaryName}
                onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Bendahara Umum *</label>
              <input
                type="text"
                required
                value={formData.treasurerName}
                onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Rekening Kas & Iuran */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Rekening Kas & Nominal Iuran Anggota</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nominal Iuran Bulanan Standar (Rp) *</label>
              <input
                type="number"
                required
                value={formData.defaultMonthlyDue}
                onChange={(e) => setFormData({ ...formData, defaultMonthlyDue: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Bank / Dompet Digital</label>
              <input
                type="text"
                placeholder="Bank Mandiri / BCA / BRI / BSI"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening Kas</label>
              <input
                type="text"
                placeholder="137-00-1928374-1"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Atas Nama Pemilik Rekening</label>
              <input
                type="text"
                placeholder="BENDAHARA HIMA IF"
                value={formData.bankAccountHolder}
                onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center space-x-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>

      </form>

      {/* Section 4: Data Backup, Restore & Reset */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Cadangan Data & Pemulihan (Backup & Restore)
        </h2>
        <p className="text-xs text-slate-500">
          Unduh seluruh database (anggota, sesi absensi, catatan kas, dan status iuran) sebagai berkas JSON untuk disimpan secara aman atau dipindahkan ke perangkat lain.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          <button
            type="button"
            onClick={onExportAllData}
            className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-left flex flex-col justify-between space-y-3 transition-colors"
          >
            <div className="p-2 bg-indigo-600 text-white rounded-lg w-fit">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs">Backup Database (JSON)</p>
              <p className="text-2xs text-indigo-600 mt-0.5">Unduh data cadangan offline</p>
            </div>
          </button>

          <label className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-left flex flex-col justify-between space-y-3 transition-colors cursor-pointer">
            <div className="p-2 bg-emerald-600 text-white rounded-lg w-fit">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs">Restore Database (JSON)</p>
              <p className="text-2xs text-emerald-700 mt-0.5">Unggah berkas JSON cadangan</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin mengatur ulang data ke data demo bawaan (HIMA-IF)?')) {
                onResetDemoData();
                alert('Data berhasil di-reset ke data bawaan.');
              }
            }}
            className="p-4 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-left flex flex-col justify-between space-y-3 transition-colors"
          >
            <div className="p-2 bg-slate-600 text-white rounded-lg w-fit">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs">Reset ke Contoh Bawaan</p>
              <p className="text-2xs text-slate-500 mt-0.5">Kembalikan data sampel organisasi</p>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
};
