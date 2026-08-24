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
  Zap,
  Code,
  Copy,
  Info,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  SpreadsheetInfo, 
  SpreadsheetDataPayload, 
  createOrganizationSpreadsheet, 
  syncAllToSpreadsheet, 
  fetchDataFromSpreadsheet,
  getSpreadsheetDetails,
  DEFAULT_APPS_SCRIPT_URL,
  APPS_SCRIPT_DEPLOYMENT_ID,
  APPS_SCRIPT_CODE_TEMPLATE,
  syncViaAppsScript,
  fetchViaAppsScript
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

const STORAGE_GAS_URL = 'org_app_gas_url_v1';

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
  // Main mode selector: 'apps_script' (No Login required) vs 'oauth' (Google Login)
  const [syncMethod, setSyncMethod] = useState<'apps_script' | 'oauth'>('apps_script');
  
  // Apps Script Webhook State
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_GAS_URL) || DEFAULT_APPS_SCRIPT_URL;
  });
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // OAuth Sub-tab State
  const [oauthTab, setOauthTab] = useState<'create' | 'connect'>('create');
  const [existingInput, setExistingInput] = useState('');

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 8000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // ==========================================
  // HANDLERS FOR APPS SCRIPT (CARA 1: TANPA LOGIN)
  // ==========================================
  const handleSaveAndSyncViaAppsScript = async () => {
    const url = appsScriptUrl.trim();
    if (!url || !url.startsWith('http')) {
      showStatus('error', 'Masukkan URL Google Apps Script Web App (/exec) yang valid.');
      return;
    }

    try {
      setIsLoading(true);
      localStorage.setItem(STORAGE_GAS_URL, url);

      const result = await syncViaAppsScript(url, currentDataPayload);

      // Save connected state
      const newConnectedInfo: SpreadsheetInfo = {
        id: 'apps-script-connected',
        title: result.spreadsheetTitle || 'Google Spreadsheet (Apps Script)',
        url: url,
        sheets: ['Info_Organisasi', 'Data_Anggota', 'Kegiatan_Presensi', 'Rekap_Presensi', 'Buku_Kas_Keuangan', 'Iuran_Kas_Bulanan', 'RAB_Anggaran'],
        lastSynced: new Date().toISOString(),
      };

      onSpreadsheetConnected(newConnectedInfo);
      showStatus('success', `Berhasil! ${result.message || 'Semua 7 lembar kerja data aplikasi telah disinkronkan ke Google Spreadsheet tanpa login!'}`);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('AUTH_REQUIRED_FOR_GAS') || err.message?.includes('Siapa saja')) {
        showStatus('error', 'Izin Web App: Di Google Apps Script, klik "Deploy" > "Kelola Deployment", lalu pastikan "Yang memiliki akses (Who has access)" disetel ke "Siapa saja (Anyone)".');
      } else {
        showStatus('error', `Gagal sinkronisasi via Apps Script: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullViaAppsScript = async () => {
    const url = appsScriptUrl.trim();
    if (!url) {
      showStatus('error', 'Masukkan URL Google Apps Script Web App terlebih dahulu.');
      return;
    }

    if (!confirm('Apakah Anda ingin memuat data dari Google Sheets ke aplikasi? Data lokal akan diperbarui.')) {
      return;
    }

    try {
      setIsLoading(true);
      const imported = await fetchViaAppsScript(url);
      onApplyImportedData(imported);
      showStatus('success', 'Data dari Google Spreadsheet berhasil ditarik dan dimuat ke aplikasi!');
    } catch (err: any) {
      console.error(err);
      showStatus('error', `Gagal menarik data via Apps Script: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLERS FOR GOOGLE OAUTH
  // ==========================================
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
      
      await syncAllToSpreadsheet(accessToken, sheetId, currentDataPayload, true);

      const connectedInfo = {
        ...details,
        lastSynced: new Date().toISOString(),
      };

      onSpreadsheetConnected(connectedInfo);
      showStatus('success', `Berhasil! Lembar kerja telah dibuat & data langsung disinkronkan ke: "${details.title}"`);
    } catch (err: any) {
      console.error(err);
      showStatus('error', `Gagal menghubungkan & sinkronisasi: ${err.message}. Pastikan akun Google memiliki akses edit.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToSheetsOAuth = async () => {
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

  const handlePullFromSheetsOAuth = async () => {
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
                Sinkronkan seluruh data anggota, presensi, kas, dan RAB ke Google Spreadsheet.
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
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Method Switcher Header Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            id="tab-method-apps-script"
            onClick={() => setSyncMethod('apps_script')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              syncMethod === 'apps_script'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Cara 1: Apps Script (Tanpa Login)</span>
            <span className="px-1.5 py-0.5 rounded text-2xs bg-amber-100 text-amber-800">Rekomendasi</span>
          </button>

          <button
            type="button"
            id="tab-method-oauth"
            onClick={() => setSyncMethod('oauth')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
              syncMethod === 'oauth'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cara 2: Login Akun Google (OAuth)</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* ========================================================================= */}
          {/* METHOD 1: APPS SCRIPT WEBHOOK (TANPA LOGIN) */}
          {/* ========================================================================= */}
          {syncMethod === 'apps_script' && (
            <div className="space-y-5">
              
              {/* Feature info banner */}
              <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900">Sinkronisasi Instan Tanpa Perlu Login Akun</p>
                  <p className="text-slate-600 leading-relaxed">
                    Menggunakan Webhook Google Apps Script. Pengguna web bisa langsung mengirim seluruh 7 tab data ke spreadsheet Anda tanpa perlu autentikasi popup Google.
                  </p>
                </div>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  URL Google Apps Script Web App (/exec):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    id="input-gas-webhook-url"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center justify-between text-2xs text-slate-500">
                  <span>ID Penerapan: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">{APPS_SCRIPT_DEPLOYMENT_ID}</code></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  id="btn-sync-apps-script"
                  onClick={handleSaveAndSyncViaAppsScript}
                  disabled={isLoading || !appsScriptUrl.trim()}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyinkronkan ke Spreadsheet...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload & Sinkronkan Sekarang</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-pull-apps-script"
                  onClick={handlePullViaAppsScript}
                  disabled={isLoading || !appsScriptUrl.trim()}
                  className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
                >
                  <DownloadCloud className="w-4 h-4 text-slate-600" />
                  <span>Tarik Data dari Spreadsheet</span>
                </button>
              </div>

              {/* Summary of Data to Sync */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-slate-700">7 Lembar Kerja yang Disinkronkan:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-slate-400">Data Anggota</p>
                    <p className="font-bold text-slate-800">{currentDataPayload.members.length} Orang</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-slate-400">Kegiatan</p>
                    <p className="font-bold text-slate-800">{currentDataPayload.events.length} Sesi</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-slate-400">Buku Kas</p>
                    <p className="font-bold text-slate-800">{currentDataPayload.transactions.length} Transaksi</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-slate-400">Rekap Iuran</p>
                    <p className="font-bold text-slate-800">{currentDataPayload.duesRecords.length} Baris</p>
                  </div>
                </div>
              </div>

              {/* Expandable Script Code & Setup Tutorial */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCodeSnippet(!showCodeSnippet)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    <span>Panduan Deploy Google Apps Script & Kode Webhook</span>
                  </div>
                  <span className="text-2xs text-indigo-600 font-semibold">
                    {showCodeSnippet ? 'Tutup Panduan' : 'Lihat Kode & Panduan'}
                  </span>
                </button>

                {showCodeSnippet && (
                  <div className="p-4 space-y-4 bg-white border-t border-slate-200 text-xs">
                    <div className="space-y-2 text-slate-600 leading-relaxed">
                      <p className="font-bold text-slate-900">Langkah Pemasangan di Google Spreadsheet:</p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Buka spreadsheet Anda di Google Drive.</li>
                        <li>Klik menu <b>Ekstensi</b> &gt; <b>Apps Script</b>.</li>
                        <li>Hapus kode bawaan dan tempelkan kode di bawah ini.</li>
                        <li>Klik <b>Terapkan (Deploy)</b> &gt; <b>Deployment Baru (New Deployment)</b>.</li>
                        <li>Pilih tipe <b>Aplikasi Web (Web App)</b>:
                          <ul className="list-disc pl-4 mt-1 font-semibold text-slate-800">
                            <li>Jalankan sebagai (Execute as): <i>Saya (Me)</i></li>
                            <li>Yang memiliki akses (Who has access): <span className="text-emerald-700 underline">Siapa saja (Anyone)</span> *(Penting agar tidak perlu login)*</li>
                          </ul>
                        </li>
                        <li>Klik <b>Deploy</b> dan salin URL Web App (/exec) ke input di atas.</li>
                      </ol>
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-3 py-1.5 rounded-t-xl text-2xs font-mono">
                        <span>Code.gs</span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white font-sans transition-colors"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Tersalin!' : 'Salin Kode'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-b-xl overflow-x-auto text-2xs font-mono max-h-48 leading-relaxed">
                        {APPS_SCRIPT_CODE_TEMPLATE}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* METHOD 2: GOOGLE OAUTH POPUP */}
          {/* ========================================================================= */}
          {syncMethod === 'oauth' && (
            <div className="space-y-5">
              
              {/* Account Connection Bar */}
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

              {/* Connected Spreadsheet Card or Connect/Create Options */}
              {connectedSpreadsheet && connectedSpreadsheet.id !== 'apps-script-connected' ? (
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
                      <span>Buka di Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  </div>

                  {/* Sync Controls */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSyncToSheetsOAuth}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                      >
                        <UploadCloud className="w-4 h-4 mr-1.5" />
                        <span>Upload / Sinkronkan ke Sheets</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePullFromSheetsOAuth}
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
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="flex border-b border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setOauthTab('create')}
                      className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                        oauthTab === 'create'
                          ? 'border-indigo-600 text-indigo-700 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Spreadsheet Baru</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOauthTab('connect')}
                      className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                        oauthTab === 'connect'
                          ? 'border-indigo-600 text-indigo-700 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Hubungkan ID / URL</span>
                    </button>
                  </div>

                  {oauthTab === 'create' && (
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sistem akan membuat berkas Google Spreadsheet baru di Google Drive akun Anda dengan 7 lembar kerja terstruktur dan mengisi seluruh data awal.
                      </p>

                      <button
                        type="button"
                        onClick={handleCreateNewSheet}
                        disabled={isLoading || !currentUser}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sedang Membuat Spreadsheet...</span>
                          </>
                        ) : (
                          <>
                            <Table2 className="w-4 h-4" />
                            <span>Buat Database Spreadsheet Sekarang</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {oauthTab === 'connect' && (
                    <form onSubmit={handleConnectExisting} className="p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          URL atau ID Google Spreadsheet:
                        </label>
                        <input
                          type="text"
                          placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR.../edit"
                          value={existingInput}
                          onChange={(e) => setExistingInput(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !currentUser || !existingInput.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-colors"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Menyiapkan Tab & Mengunggah Data...</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4" />
                            <span>Hubungkan & Sinkronkan Data</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Section 3: Auto Sync Setting */}
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
