import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Building2, 
  School,
  FileSpreadsheet
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signInWithEmail, 
  registerWithEmail, 
  resetPassword, 
  googleSignIn,
} from '../services/authService';
import { OrganizationConfig } from '../types';

interface LoginViewProps {
  config: OrganizationConfig;
  onLoginSuccess: (user: User, token: string | null) => void;
  onTriggerFeedback?: (title: string, message: string, type?: 'success' | 'celebrate') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  config,
  onLoginSuccess,
  onTriggerFeedback,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Anggota Pengurus');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }

    if (mode !== 'forgot' && (!password || password.length < 4)) {
      setErrorMessage('Kata sandi harus diisi minimal 4 karakter.');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setErrorMessage('Nama lengkap siswa/pengurus wajib diisi.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const user = await signInWithEmail(email, password);
        if (onTriggerFeedback) {
          onTriggerFeedback(
            'Login Berhasil!', 
            `Selamat datang kembali, ${user.displayName || user.email}`, 
            'celebrate'
          );
        }
        onLoginSuccess(user, null);
      } else if (mode === 'register') {
        const user = await registerWithEmail(email, password, displayName, selectedRole);
        if (onTriggerFeedback) {
          onTriggerFeedback(
            'Akun Berhasil Dibuat!', 
            `Akun ${user.displayName} berhasil didaftarkan sebagai ${selectedRole}`, 
            'celebrate'
          );
        }
        onLoginSuccess(user, null);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage(
          `Instruksi reset kata sandi telah diproses untuk ${email}. Jika akun dibuat lokal oleh Administrator, silakan hubungi Administrator untuk melihat kata sandi Anda.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Silakan periksa kembali email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        if (onTriggerFeedback) {
          onTriggerFeedback('Login Google Berhasil!', `Terhubung sebagai ${res.user.displayName || res.user.email}`, 'celebrate');
        }
        onLoginSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal login menggunakan akun Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto">
        
        {/* Branding & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-xl">
            {config.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt="Logo Organisasi" 
                className="w-12 h-12 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <School className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          
          <h1 className="text-2xl font-black text-white tracking-tight">
            {config.name || 'Sistem Informasi Manajemen OSIS'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {config.institution || 'Portal Resmi Pengurus OSIS'} &bull; Periode {config.period || '2026/2027'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Card Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5">
            <button
              type="button"
              id="tab-login-btn"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Akun</span>
            </button>
            <button
              type="button"
              id="tab-register-btn"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Pengurus</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Info Badge */}
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-2xs text-slate-300 leading-relaxed">
                <p className="font-bold text-white mb-0.5">Autentikasi Administrator & Pengurus</p>
                <p>
                  Gunakan Email & Password yang telah didaftarkan atau dibuat oleh Administrator.
                </p>
              </div>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-2xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">
                      Nama Lengkap Pengurus *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        id="input-login-name"
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Contoh: Muhammad Farhan"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">
                      Jabatan / Posisi OSIS *
                    </label>
                    <select
                      id="select-login-role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    >
                      <option value="Ketua Umum OSIS">👑 Ketua Umum OSIS</option>
                      <option value="Wakil Ketua OSIS">🤝 Wakil Ketua OSIS</option>
                      <option value="Sekretaris Umum">📝 Sekretaris Umum</option>
                      <option value="Bendahara Umum">💰 Bendahara Umum</option>
                      <option value="Ketua Sekbid">⭐ Ketua Sekbid</option>
                      <option value="Anggota Pengurus">👤 Anggota Pengurus</option>
                      <option value="Pembina OSIS">🎓 Pembina OSIS</option>
                    </select>
                  </div>
                </>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-2xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">
                  Email Akun *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@osis.sch.id / email Anda"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-2xs font-bold text-slate-300 uppercase tracking-wide">
                      Kata Sandi (Password) *
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-2xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Lupa sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password on Register */}
              {mode === 'register' && (
                <div>
                  <label className="block text-2xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">
                    Ulangi Kata Sandi *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi Anda..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      {mode === 'login' 
                        ? 'Masuk ke Aplikasi' 
                        : mode === 'register' 
                        ? 'Daftarkan Akun Pengurus' 
                        : 'Kirim Link Reset Sandi'}
                    </span>
                  </>
                )}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Kembali ke Halaman Masuk
                </button>
              )}
            </form>

            {/* Google Login Option */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-login-google"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Masuk dengan Google (Untuk Google Sheets)</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-2xs text-slate-500">
          <p>Sistem Informasi Manajemen OSIS &bull; Aman & Terintegrasi</p>
        </div>

      </div>
    </div>
  );
};
