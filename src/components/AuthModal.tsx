import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signInWithEmail, 
  registerWithEmail, 
  resetPassword, 
  googleSignIn 
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string | null) => void;
  onTriggerFeedback?: (title: string, message: string, type?: 'success' | 'celebrate') => void;
}

const OSIS_ROLES = [
  'Ketua Umum OSIS',
  'Wakil Ketua OSIS',
  'Sekretaris Umum',
  'Bendahara Umum',
  'Ketua Sekbid',
  'Anggota Pengurus',
  'Pembina OSIS',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onTriggerFeedback,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState(OSIS_ROLES[0]);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleTabChange = (newTab: 'login' | 'register' | 'forgot') => {
    setTab(newTab);
    resetFormState();
  };

  // 1-Click Demo Login
  const handleQuickDemoLogin = async () => {
    setEmail('admin@osis.sch.id');
    setPassword('osis123456');
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Try login first, if user doesn't exist, create it automatically
      let user: User;
      try {
        user = await signInWithEmail('admin@osis.sch.id', 'osis123456');
      } catch (err: any) {
        user = await registerWithEmail('admin@osis.sch.id', 'osis123456', 'Admin Pengurus OSIS', 'Ketua Umum OSIS');
      }

      onAuthSuccess(user, null);
      if (onTriggerFeedback) {
        onTriggerFeedback('Login Berhasil!', `Selamat datang kembali, ${user.displayName || user.email}`, 'celebrate');
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk akun demo');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    if (tab !== 'forgot' && (!password || password.length < 6)) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (tab === 'register') {
      if (!displayName.trim()) {
        setErrorMessage('Nama lengkap wajib diisi.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (tab === 'login') {
        const user = await signInWithEmail(email, password);
        onAuthSuccess(user, null);
        if (onTriggerFeedback) {
          onTriggerFeedback('Login Berhasil!', `Selamat datang, ${user.displayName || user.email}`, 'success');
        }
        onClose();
      } else if (tab === 'register') {
        const user = await registerWithEmail(email, password, displayName, selectedRole);
        onAuthSuccess(user, null);
        if (onTriggerFeedback) {
          onTriggerFeedback('Pendaftaran Berhasil!', `Akun ${user.displayName} telah aktif sebagai ${selectedRole}.`, 'celebrate');
        }
        onClose();
      } else if (tab === 'forgot') {
        await resetPassword(email);
        setSuccessMessage(`Tautan reset kata sandi telah dikirim ke email ${email}. Silakan periksa kotak masuk/spam Anda.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan. Silakan periksa kembali data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login alternative
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        if (onTriggerFeedback) {
          onTriggerFeedback('Login Google Berhasil!', `Terhubung sebagai ${res.user.displayName || res.user.email}`, 'celebrate');
        }
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk dengan Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="auth-modal-content"
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200"
      >
        
        {/* Header with OSIS theme */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Portal Akun OSIS</h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Autentikasi
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Masuk untuk mengelola presensi, keuangan, dan data organisasi.
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

        {/* Tab switchers */}
        <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            id="tab-auth-login"
            onClick={() => handleTabChange('login')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              tab === 'login'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>

          <button
            type="button"
            id="tab-auth-register"
            onClick={() => handleTabChange('register')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              tab === 'register'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun</span>
          </button>

          <button
            type="button"
            id="tab-auth-forgot"
            onClick={() => handleTabChange('forgot')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              tab === 'forgot'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Lupa Sandi</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Demo Login Preset Button */}
          {tab === 'login' && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Uji Coba Cepat (Demo)</p>
                  <p className="text-2xs text-slate-500">Masuk instan dengan akun Admin OSIS</p>
                </div>
              </div>

              <button
                type="button"
                id="btn-quick-demo-login"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
              >
                Masuk Demo
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Display Name (Register only) */}
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="input-auth-name"
                      placeholder="Contoh: Muhammad Rayhan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Posisi OSIS:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <select
                      id="input-auth-role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      {OSIS_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="input-auth-email"
                  placeholder="pengurus@osis.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            {tab !== 'forgot' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-auth-password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Register only) */}
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-auth-password-confirm"
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : tab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Akun</span>
                </>
              ) : tab === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Akun Baru</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Kirim Tautan Reset</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-2xs text-slate-400 uppercase tracking-wider font-bold shrink-0">
              atau
            </span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          {/* Google Sign In Alternative */}
          <button
            type="button"
            id="btn-auth-google"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Masuk dengan Akun Google</span>
          </button>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500">
          <span>Sistem Manajemen OSIS Terpadu</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
