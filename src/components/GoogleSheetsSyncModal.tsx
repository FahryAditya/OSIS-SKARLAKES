import React, { useState } from 'react';
import { 
  X, 
  Table2, 
  ExternalLink, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Link as LinkIcon, 
  Database,
  FileSpreadsheet,
  Check,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  SpreadsheetInfo, 
  SpreadsheetDataPayload, 
  createOrganizationSpreadsheet, 
  syncAllToSpreadsheet, 
  fetchDataFromSpreadsheet,
  getSpreadsheetDetails
} from '../services/googleSheetsService';
import { googleSignIn, logoutGoogle } from '../services/googleAuth';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  accessToken: string | null;
  connectedSpreadsheet: SpreadsheetInfo | null;
  lastSyncedAt: string | null;
  isAutoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onSpreadsheetConnected: (info: SpreadsheetInfo) => void;
  onSpreadsheetDisconnected: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
  currentDataPayload: SpreadsheetDataPayload;
  onApplyImportedData: (data: Partial<SpreadsheetDataPayload>) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accessToken,
  connectedSpreadsheet,
  lastSyncedAt,
  isAutoSyncEnabled,
  onToggleAutoSync,
  onSpreadsheetConnected,
  onSpreadsheetDisconnected,
  onAuthSuccess,
  onAuthLogout,
  currentDataPayload,
  onApplyImportedData,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'create' | 'connect'>('status');
  const [existingInput, setExistingInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 6000);
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        showStatus('success', `Berhasil masuk dengan akun Google: ${res.user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      showStatus('error', err.message || 'Gagal masuk dengan Google. Pastikan popup tidak diblokir.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      onAuthLogout();
      showStatus('info', 'Berhasil keluar dari akun Google.');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      showStatus('error', 'Silakan hubungkan akun Google terlebih dahulu.');
      return;
    }

    try {
      setIsLoading(true);
      const info = await createOrganizationSpreadsheet(accessToken, currentDataPayload);
      onSpreadsheetConnected(info);
      setActiveTab('status');
      showStatus('success', `Spreadsheet Database baru berhasil dibuat: "${info.title}"`);
    } catch (err: any) {
      console.error(err);
      showStatus('error', `Gagal membuat spreadsheet: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      showStatus('error', 'Silakan hubungkan akun Google terlebih dahulu.');
      return;
    }

    // Extract ID from full URL if provided (https://docs.google.com/spreadsheets/d/{ID}/edit)
    let sheetId = existingInput.trim();
    const urlMatch = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      sheetId = urlMatch[1];
    }

    if (!sheetId) {
      showStatus('error', 'Masukkan ID atau URL Google Spreadsheet yang valid.');
      return;
    }

    try {
      setIsLoading(true);
      const details = await getSpreadsheetDetails(accessToken, sheetId);
      onSpreadsheetConnected(details);
      setActiveTab('status');
      showStatus('success', `Berhasil terhubung ke spreadsheet: "${details.title}"`);
    } catch (err: any) {
      console.error(err);
      showStatus('error', `Gagal memverifikasi spreadsheet: ${err.message}. Pastikan akun Google memiliki akses.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!accessToken || !connectedSpreadsheet) {
      showStatus('error', 'Belum terhubung ke Google Sheets.');
      return;
    }

    try {
      setIsLoading(true);
      await syncAllToSpreadsheet(accessToken, connectedSpreadsheet.id, currentDataPayload);
      onSpreadsheetConnected({
        ...connectedSpreadsheet,
        lastSynced: new Date().toISOString(),
      });
      showStatus('success', 'Semua data aplikasi berhasil disinkronkan ke Google Sheets!');
    } catch (err: any) {
      console.error(err);
      showStatus('error', `Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!accessToken || !connectedSpreadsheet) {
      showStatus('error', 'Belum terhubung ke Google Sheets.');
      return;
    }

    if (!confirm('Apakah Anda ingin memuat data dari Google Sheets ke aplikasi? Data lokal akan disinkronkan dengan data di Google Sheets.')) {
      return;
    }

    try {
      setIsLoading(true);
      const imported = await fetchDataFromSpreadsheet(accessToken, connectedSpreadsheet.id);
      onApplyImportedData(imported);
      showStatus('success', 'Data dari Google Sheets berhasil dimuat ke dalam aplikasi!');
    } catch (err: any) {
      console.error(err);
      showStatus('error', `Gagal memuat data dari Google Sheets: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="google-sheets-modal-content" 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200"
      >
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Database Google Sheets</h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cloud DB
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simpan, sinkronkan, dan kelola database organisasi langsung di Google Spreadsheets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div className={`p-4 text-xs font-semibold flex items-center space-x-2 border-b ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="p-6 space-y-6">

          {/* Section 1: Google Account Connection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {currentUser ? (
                <>
                  <img 
                    src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=0F172A&color=fff`} 
                    alt="User" 
                    className="w-11 h-11 rounded-full border-2 border-white shadow-2xs object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-slate-900">{currentUser.displayName || 'Akun Google Terhubung'}</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3 mr-0.5" /> Terhubung
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <Database className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Autentikasi Akun Google</p>
                    <p className="text-xs text-slate-500">Masuk untuk memberi akses baca & tulis Google Sheets</p>
                  </div>
                </>
              )}
            </div>

            <div>
              {currentUser ? (
                <button
                  type="button"
                  id="btn-google-signout"
                  onClick={handleSignOut}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
                >
                  Ganti Akun
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-google-signin"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:shadow-xs active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Connected Spreadsheet Card / Connect Options */}
          {connectedSpreadsheet ? (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-sm font-bold text-slate-900">{connectedSpreadsheet.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-1">ID: {connectedSpreadsheet.id}</p>
                </div>

                <a
                  href={connectedSpreadsheet.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors shadow-2xs"
                >
                  <span>Buka di Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </div>

              {/* Sheet Tables Overview */}
              <div className="pt-2 border-t border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <p className="text-slate-500 font-medium">Data Anggota</p>
                  <p className="text-xs font-bold text-slate-900">{currentDataPayload.members.length} Orang</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <p className="text-slate-500 font-medium">Sesi Kegiatan</p>
                  <p className="text-xs font-bold text-slate-900">{currentDataPayload.events.length} Sesi</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <p className="text-slate-500 font-medium">Buku Kas</p>
                  <p className="text-xs font-bold text-slate-900">{currentDataPayload.transactions.length} Catatan</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <p className="text-slate-500 font-medium">Rekap Iuran</p>
                  <p className="text-xs font-bold text-slate-900">{currentDataPayload.duesRecords.length} Baris</p>
                </div>
              </div>

              {/* Sync Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    id="btn-sync-to-sheets"
                    onClick={handleSyncToSheets}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 mr-1.5" />
                    <span>Upload / Sinkronkan ke Sheets</span>
                  </button>

                  <button
                    type="button"
                    id="btn-pull-from-sheets"
                    onClick={handlePullFromSheets}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors"
                  >
                    <DownloadCloud className="w-4 h-4 mr-1.5 text-slate-600" />
                    <span>Tarik Data dari Sheets</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onSpreadsheetDisconnected}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
                >
                  Putuskan Spreadsheet
                </button>
              </div>

              {lastSyncedAt && (
                <p className="text-2xs text-slate-400">
                  Sinkronisasi terakhir: {new Date(lastSyncedAt).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              
              {/* Option Selector Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                    activeTab === 'create' || activeTab === 'status'
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Database Spreadsheet Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('connect')}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                    activeTab === 'connect'
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Hubungkan ID Spreadsheet yang Ada</span>
                </button>
              </div>

              {/* Tab 1: Create New */}
              {(activeTab === 'create' || activeTab === 'status') && (
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center">
                      <Sparkles className="w-4 h-4 text-indigo-600 mr-1.5" />
                      Inisialisasi Database Google Sheets Otomatis
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sistem akan membuat berkas Google Spreadsheet baru di Google Drive Anda dengan 7 lembar kerja terstruktur:
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-2xs">
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-mono">📊 Data_Anggota</span>
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-mono">📅 Kegiatan_Presensi</span>
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-mono">📋 Rekap_Presensi</span>
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-mono">💰 Buku_Kas_Keuangan</span>
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-mono">🪙 Iuran_Kas_Bulanan</span>
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-mono">📑 RAB_Anggaran</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-create-org-sheet"
                      onClick={handleCreateNewSheet}
                      disabled={isLoading || !currentUser}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sedang Membuat & Mengisi Spreadsheet...</span>
                        </>
                      ) : (
                        <>
                          <Table2 className="w-4 h-4" />
                          <span>Buat Database Spreadsheet Sekarang</span>
                        </>
                      )}
                    </button>
                    {!currentUser && (
                      <p className="text-2xs text-amber-600 mt-2 text-center font-medium">
                        * Silakan klik "Sign in with Google" di atas terlebih dahulu untuk membuat database.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Connect Existing */}
              {activeTab === 'connect' && (
                <form onSubmit={handleConnectExisting} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      URL atau ID Google Spreadsheet:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XR.../edit atau 1BxiMVs0XR..."
                      value={existingInput}
                      onChange={(e) => setExistingInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-2xs text-slate-400 mt-1">
                      Pastikan akun Google yang Anda gunakan telah memiliki izin edit pada spreadsheet tersebut.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !currentUser || !existingInput.trim()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-colors"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                    <span>Hubungkan Spreadsheet</span>
                  </button>
                </form>
              )}

            </div>
          )}

          {/* Section 3: Auto Sync Setting & Feature Highlights */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Sinkronisasi Otomatis (Auto-Sync)</p>
                <p className="text-2xs text-slate-500">
                  Otomatis kirim catatan presensi dan transaksi baru langsung ke baris Google Sheets
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAutoSyncEnabled}
                onChange={(e) => onToggleAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
