import React, { useState, useEffect } from 'react';
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
  Database,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  Users,
  CalendarCheck,
  Wallet
} from 'lucide-react';
import { OrganizationConfig } from '../types';
import { 
  getAdminAccounts, 
  addAdminAccount, 
  updateAdminAccount, 
  deleteAdminAccount, 
  AdminAccount 
} from '../services/authService';

interface SettingsViewProps {
  config: OrganizationConfig;
  onUpdateConfig: (updated: OrganizationConfig) => void;
  onExportAllData: () => void;
  onImportData: (jsonData: string) => void;
  onResetDemoData: () => void;
  onClearMembers?: () => void;
  onClearFinance?: () => void;
  onClearAttendance?: () => void;
  onClearBudget?: () => void;
  onSyncDb?: () => void;
  lastSyncedAt?: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  onExportAllData,
  onImportData,
  onResetDemoData,
  onClearMembers,
  onClearFinance,
  onClearAttendance,
  onClearBudget,
  onSyncDb,
  lastSyncedAt,
}) => {
  const [formData, setFormData] = useState<OrganizationConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Admin Accounts State
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  // Account Form state
  const [accEmail, setAccEmail] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accDisplayName, setAccDisplayName] = useState('');
  const [accRole, setAccRole] = useState('Anggota Pengurus');
  const [accShowPass, setAccShowPass] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);
  const [accSuccess, setAccSuccess] = useState<string | null>(null);

  useEffect(() => {
    setAccounts(getAdminAccounts());
  }, []);

  const refreshAccounts = () => {
    setAccounts(getAdminAccounts());
  };

  const handleOpenAddAccount = () => {
    setEditingAccountId(null);
    setAccEmail('');
    setAccPassword('');
    setAccDisplayName('');
    setAccRole('Anggota Pengurus');
    setAccError(null);
    setAccSuccess(null);
    setShowAddAccountModal(true);
  };

  const handleOpenEditAccount = (acc: AdminAccount) => {
    setEditingAccountId(acc.id);
    setAccEmail(acc.email);
    setAccPassword(acc.password);
    setAccDisplayName(acc.displayName);
    setAccRole(acc.role);
    setAccError(null);
    setAccSuccess(null);
    setShowAddAccountModal(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccError(null);

    if (!accEmail.trim() || !accEmail.includes('@')) {
      setAccError('Masukkan alamat email yang valid.');
      return;
    }
    if (!accPassword.trim() || accPassword.length < 4) {
      setAccError('Kata sandi minimal 4 karakter.');
      return;
    }
    if (!accDisplayName.trim()) {
      setAccError('Nama lengkap pengurus wajib diisi.');
      return;
    }

    if (editingAccountId) {
      updateAdminAccount(editingAccountId, {
        email: accEmail.trim().toLowerCase(),
        password: accPassword.trim(),
        displayName: accDisplayName.trim(),
        role: accRole,
      });
      setAccSuccess('Akun pengurus berhasil diperbarui!');
    } else {
      addAdminAccount({
        email: accEmail.trim().toLowerCase(),
        password: accPassword.trim(),
        displayName: accDisplayName.trim(),
        role: accRole,
      });
      setAccSuccess('Akun pengurus baru berhasil dibuat!');
    }

    refreshAccounts();
    setTimeout(() => {
      setShowAddAccountModal(false);
      setAccSuccess(null);
    }, 1200);
  };

  const handleDeleteAccount = (acc: AdminAccount) => {
    if (acc.email === 'admin@osis.sch.id' && accounts.length <= 1) {
      alert('Tidak dapat menghapus akun Administrator utama.');
      return;
    }
    if (confirm(`Hapus akun login ${acc.displayName} (${acc.email})?`)) {
      deleteAdminAccount(acc.id);
      refreshAccounts();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig = {
      ...formData,
      logoUrl: formData.logoUrl?.trim() || '/logo.png',
    };
    onUpdateConfig(updatedConfig);
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

      {/* NeonDB Database Card in Settings */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-md border border-emerald-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Database Cloud NeonDB (PostgreSQL)</h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
                  Aktif Terhubung
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Penyimpanan cloud utama terenkripsi berbasis PostgreSQL di AWS Cloud (Neon Serverless). Semua perubahan data tersimpan secara otomatis dan permanen di cloud.
              </p>
            </div>
          </div>

          {onSyncDb && (
            <button
              type="button"
              id="btn-settings-sync-db"
              onClick={onSyncDb}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 shrink-0"
            >
              <RefreshCw className="w-4 h-4 text-slate-950" />
              <span>Sinkronkan ke Cloud NeonDB</span>
            </button>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-mono text-2xs bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
              Host: ep-dark-mouse-azmzhuxs.c-3.ap-southeast-1.aws.neon.tech / neondb
            </span>
          </div>
          {lastSyncedAt && (
            <span className="text-2xs text-slate-400">
              Terakhir disinkronkan: {new Date(lastSyncedAt).toLocaleString('id-ID')}
            </span>
          )}
        </div>
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
                <img 
                  src={formData.logoUrl || '/logo.png'} 
                  alt="Preview Logo" 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0 bg-white"
                />
                <input
                  type="text"
                  placeholder="/logo.png"
                  value={formData.logoUrl || '/logo.png'}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs"
                />
              </div>
              <p className="text-2xs text-slate-400 mt-1">Logo ini tetap tersimpan permanen (`/logo.png`) dan disematkan di navbar, kop kwitansi, LPJ resmi, portal presensi, dan dashboard tanpa terhapus saat mengubah sistem iuran.</p>
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
              <label className="block font-semibold text-slate-700 mb-1">Nominal Iuran Mingguan Standar (Rp)</label>
              <input
                type="number"
                value={formData.defaultWeeklyDue || 2500}
                onChange={(e) => setFormData({ ...formData, defaultWeeklyDue: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bulan Mulai Pembayaran Iuran *</label>
              <select
                value={formData.duesStartMonth || 8}
                onChange={(e) => setFormData({ ...formData, duesStartMonth: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((n, i) => (
                  <option key={i+1} value={i+1}>{n} ({i+1})</option>
                ))}
              </select>
              <p className="text-2xs text-slate-400 mt-1">Bulan pertama di mana iuran kas wajib dibayar. Matriks iuran akan dimulai dari bulan ini.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bulan Akhir Pembayaran Iuran *</label>
              <select
                value={formData.duesEndMonth || 7}
                onChange={(e) => setFormData({ ...formData, duesEndMonth: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((n, i) => (
                  <option key={i+1} value={i+1}>{n} ({i+1})</option>
                ))}
              </select>
              <p className="text-2xs text-slate-400 mt-1">Bulan terakhir periode iuran. Misal: Ags-Jul untuk tahun ajaran penuh (12 bulan lintas tahun).</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minggu Mulai Efektif Kas Global *</label>
              <select
                value={formData.duesStartWeek || 1}
                onChange={(e) => setFormData({ ...formData, duesStartWeek: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50/40 rounded-lg text-sm font-bold text-indigo-950"
              >
                <option value={1}>Minggu 1 (Kas Dimulai Minggu 1 - Normal)</option>
                <option value={2}>Minggu 2 (Kas Efektif Mulai Minggu 2)</option>
                <option value={3}>Minggu 3 (Kas Efektif Mulai Minggu 3)</option>
                <option value={4}>Minggu 4 (Kas Efektif Mulai Minggu 4)</option>
              </select>
              <p className="text-2xs text-slate-500 mt-1">Jika disetel mulai Minggu 2/3, maka minggu sebelumnya otomatis disinkronkan sebagai <strong>Bebas/Libur Kas</strong> bagi seluruh 40+ anggota.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minggu Libur Kas Global (Opsional)</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[1, 2, 3, 4].map(w => {
                  const currentList = formData.globalExemptWeeks || [];
                  const isChecked = currentList.includes(w);
                  return (
                    <label key={w} className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      isChecked ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-2xs' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...currentList, w].sort((a, b) => a - b)
                            : currentList.filter(x => x !== w);
                          setFormData({ ...formData, globalExemptWeeks: updated });
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Mgg {w} Libur</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-2xs text-slate-500 mt-1">Centang minggu yang diliburkan secara umum untuk seluruh anggota OSIS.</p>
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

        {/* Section 4: Google Gemini AI API Key */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Integrasi Kecerdasan Buatan (Google Gemini AI API)</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google Gemini API Key (Opsional)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={formData.geminiApiKey || ''}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-purple-300 bg-purple-50/30 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-2xs text-slate-500 mt-1">
                Kunci API resmi dari Google AI Studio. Jika diisi, Asisten AI OSIS akan terhubung langsung ke model <strong>Google Gemini 1.5/2.5 Flash Cloud</strong>. Jika dikosongkan, sistem menggunakan <strong>Smart Local Inference Engine</strong> (0ms).
              </p>
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

      {/* Section: Akun Pengurus & Administrator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Manajemen Akun Login Pengurus (Dibuat oleh Administrator)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar email dan kata sandi resmi untuk pengurus OSIS login ke sistem.
            </p>
          </div>

          <button
            type="button"
            id="btn-settings-add-account"
            onClick={handleOpenAddAccount}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Akun Pengurus</span>
          </button>
        </div>

        {/* Accounts Table / List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-2xs">
                <th className="px-4 py-2.5 text-left">Nama Pengurus</th>
                <th className="px-4 py-2.5 text-left">Email Login</th>
                <th className="px-4 py-2.5 text-left">Jabatan</th>
                <th className="px-4 py-2.5 text-left">Kata Sandi</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {acc.displayName}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {acc.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {acc.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {acc.password}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAccount(acc)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Akun"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Modal (Add / Edit) */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingAccountId ? 'Edit Akun Pengurus' : 'Tambah Akun Pengurus Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {accError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{accError}</span>
              </div>
            )}

            {accSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{accSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Pengurus *
                </label>
                <input
                  type="text"
                  required
                  value={accDisplayName}
                  onChange={(e) => setAccDisplayName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan / Posisi *
                </label>
                <select
                  value={accRole}
                  onChange={(e) => setAccRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Administrator (Ketua Umum OSIS)">👑 Administrator (Ketua Umum OSIS)</option>
                  <option value="Wakil Ketua OSIS">🤝 Wakil Ketua OSIS</option>
                  <option value="Sekretaris Umum">📝 Sekretaris Umum</option>
                  <option value="Bendahara Umum">💰 Bendahara Umum</option>
                  <option value="Ketua Sekbid">⭐ Ketua Sekbid</option>
                  <option value="Anggota Pengurus">👤 Anggota Pengurus</option>
                  <option value="Pembina OSIS">🎓 Pembina OSIS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Login *
                </label>
                <input
                  type="email"
                  required
                  value={accEmail}
                  onChange={(e) => setAccEmail(e.target.value)}
                  placeholder="email@osis.sch.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi (Password) *
                </label>
                <div className="relative">
                  <input
                    type={accShowPass ? 'text' : 'password'}
                    required
                    value={accPassword}
                    onChange={(e) => setAccPassword(e.target.value)}
                    placeholder="Minimal 4 karakter..."
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setAccShowPass(!accShowPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {accShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingAccountId ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section 4: Data Management & Selective Deletion */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
            Manajemen Data & Penghapusan Spesifik (Clear Data)
          </h2>
          <p className="text-2xs sm:text-xs text-slate-500 mt-0.5">
            Kelola cadangan database atau hapus kategori data tertentu (Anggota, Buku Kas, Presensi, RAB) secara aman.
          </p>
        </div>

        {/* Backup & Restore Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onExportAllData}
            className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-left flex items-center space-x-3 transition-all cursor-pointer shadow-2xs"
          >
            <div className="p-2.5 bg-indigo-600 text-white rounded-lg shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs">Backup Database (JSON)</p>
              <p className="text-2xs text-indigo-600">Unduh seluruh berkas cadangan offline</p>
            </div>
          </button>

          <label className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-left flex items-center space-x-3 transition-all cursor-pointer shadow-2xs">
            <div className="p-2.5 bg-emerald-600 text-white rounded-lg shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs">Restore Database (JSON)</p>
              <p className="text-2xs text-emerald-700">Unggah & pulihkan dari berkas JSON</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Granular Deletion Controls */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h3 className="text-2xs sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
            Opsi Penghapusan Kategori Data (Hapus Data Terpisah):
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Button 1: Hapus Semua Anggota */}
            <button
              type="button"
              onClick={() => {
                if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGAPUS SEMUA DATA ANGGOTA OSIS? Data biodata dan status iuran akan dikosongkan.')) {
                  if (onClearMembers) onClearMembers();
                }
              }}
              className="p-3.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-slate-200 group-hover:bg-rose-600 text-slate-700 group-hover:text-white rounded-lg transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-rose-700">Hapus Semua Anggota</p>
              <p className="text-2xs text-slate-500 mt-0.5">Kosongkan biodata & iuran anggota</p>
            </button>

            {/* Button 2: Hapus Semua Kas & Iuran */}
            <button
              type="button"
              onClick={() => {
                if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGAPUS SEMUA TRANSAKSI KAS & IURAN? Saldo kas utama akan kembali ke Rp 0.')) {
                  if (onClearFinance) onClearFinance();
                }
              }}
              className="p-3.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-slate-200 group-hover:bg-rose-600 text-slate-700 group-hover:text-white rounded-lg transition-colors">
                  <Wallet className="w-4 h-4" />
                </div>
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-rose-700">Hapus Transaksi Kas</p>
              <p className="text-2xs text-slate-500 mt-0.5">Kosongkan Buku Kas (Saldo Rp 0)</p>
            </button>

            {/* Button 3: Hapus Presensi & Sesi */}
            <button
              type="button"
              onClick={() => {
                if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGAPUS SEMUA SESI KEGIATAN & RIWAYAT PRESENSI?')) {
                  if (onClearAttendance) onClearAttendance();
                }
              }}
              className="p-3.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-slate-200 group-hover:bg-rose-600 text-slate-700 group-hover:text-white rounded-lg transition-colors">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-rose-700">Hapus Riwayat Presensi</p>
              <p className="text-2xs text-slate-500 mt-0.5">Kosongkan sesi rapat & absensi</p>
            </button>

            {/* Button 4: Hapus Rencana RAB */}
            <button
              type="button"
              onClick={() => {
                if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGAPUS SEMUA DATA RENCANA ANGGARAN (RAB)?')) {
                  if (onClearBudget) onClearBudget();
                }
              }}
              className="p-3.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-slate-200 group-hover:bg-rose-600 text-slate-700 group-hover:text-white rounded-lg transition-colors">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
              <p className="font-bold text-xs text-slate-800 group-hover:text-rose-700">Hapus Anggaran RAB</p>
              <p className="text-2xs text-slate-500 mt-0.5">Kosongkan perancangan RAB</p>
            </button>

          </div>
        </div>

        {/* Total Database Reset */}
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (confirm('PERINGATAN UTAMA: Apakah Anda yakin ingin FORMAT / RESET TOTAL SELURUH DATABASE? Semua data lokal akan dibersihkan.')) {
                onResetDemoData();
              }
            }}
            className="w-full p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-rose-900">Format / Reset Total Seluruh Database</p>
                <p className="text-2xs text-rose-700">Bersihkan seluruh data (Anggota, Kas, Presensi, RAB & Sekbid)</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-2xs rounded-lg shadow-2xs shrink-0">
              Reset Total
            </span>
          </button>
        </div>

      </div>

    </div>
  );
};
