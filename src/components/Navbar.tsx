import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers,
  CalendarCheck, 
  Wallet, 
  Coins, 
  FileText, 
  Users, 
  Settings, 
  PlusCircle, 
  QrCode,
  Building2,
  FileSpreadsheet,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { ActiveTab, OrganizationConfig } from '../types';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: OrganizationConfig;
  onOpenSelfCheckIn: () => void;
  onOpenQuickTransaction: () => void;
  onOpenGoogleSheetsSync: () => void;
  isGoogleSheetsConnected: boolean;
  isGoogleSignedIn: boolean;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  onOpenSelfCheckIn,
  onOpenQuickTransaction,
  onOpenGoogleSheetsSync,
  isGoogleSheetsConnected,
  isGoogleSignedIn,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sekbid', label: '10 Sekbid OSIS', icon: Layers },
    { id: 'absensi', label: 'Absensi Kegiatan', icon: CalendarCheck },
    { id: 'keuangan', label: 'Buku Kas', icon: Wallet },
    { id: 'iuran', label: 'Iuran Kas', icon: Coins },
    { id: 'laporan', label: 'Laporan & Dokumen', icon: FileText },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  // Get user role from local storage if available
  let userRole = 'Pengurus OSIS';
  if (currentUser) {
    try {
      const storedProfile = localStorage.getItem(`user_profile_${currentUser.uid}`);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.role) userRole = parsed.role;
      }
    } catch (e) {}
  }

  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengurus OSIS';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      {/* Top bar info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand and Organization info */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            {config.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt={`Logo ${config.shortName}`} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover shadow-xs border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
                {config.shortName.slice(0, 2).toUpperCase() || <Building2 className="w-6 h-6" />}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base leading-tight tracking-tight">
                  {config.shortName || 'Organisasi'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {config.period}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
                {config.name}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Auth User */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Google Sheets Sync Button */}
            <button
              id="btn-nav-google-sheets"
              onClick={onOpenGoogleSheetsSync}
              className={`inline-flex items-center h-9 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border transition-all shadow-2xs ${
                isGoogleSheetsConnected
                  ? 'bg-emerald-50/90 border-emerald-300/80 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                  : isGoogleSignedIn
                  ? 'bg-amber-50 border-amber-300/80 text-amber-800 hover:bg-amber-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={isGoogleSheetsConnected ? "Tersambung ke Google Sheets (Klik untuk kelola)" : "Hubungkan Google Sheets"}
            >
              <FileSpreadsheet className={`w-4 h-4 shrink-0 ${
                isGoogleSheetsConnected ? 'text-emerald-600' : 'text-slate-500'
              } sm:mr-1.5`} />
              <span className="hidden md:inline whitespace-nowrap">
                {isGoogleSheetsConnected ? 'Sheets Terhubung' : 'Google Sheets'}
              </span>
              {isGoogleSheetsConnected && (
                <span className="ml-1.5 sm:ml-2 flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            {/* Self check in */}
            <button
              id="btn-nav-self-checkin"
              onClick={onOpenSelfCheckIn}
              className="inline-flex items-center h-9 px-2.5 sm:px-3 border border-indigo-200 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-colors shadow-2xs"
              title="Presensi Mandiri Siswa (QR / PIN)"
            >
              <QrCode className="w-4 h-4 shrink-0 text-indigo-600 sm:mr-1.5" />
              <span className="hidden md:inline whitespace-nowrap">Presensi Mandiri</span>
              <span className="hidden sm:inline md:hidden whitespace-nowrap">Presensi</span>
            </button>

            {/* Quick transaction */}
            <button
              id="btn-nav-quick-trans"
              onClick={onOpenQuickTransaction}
              className="inline-flex items-center h-9 px-3 sm:px-3.5 border border-transparent text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-2xs"
              title="Catat Kas Cepat (Pemasukan / Pengeluaran)"
            >
              <PlusCircle className="w-4 h-4 shrink-0 mr-1.5" />
              <span className="whitespace-nowrap">Catat Kas</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block"></div>

            {/* Authentication Button / User Profile Menu */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center h-9 pl-1.5 pr-2 sm:pr-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-all shadow-2xs gap-1.5"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Avatar" 
                      className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                      {userDisplayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden xl:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[90px]">
                      {userDisplayName}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Akun Terverifikasi
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {currentUser.email}
                      </p>
                      <p className="text-2xs text-indigo-600 font-semibold mt-1">
                        Posisi: {userRole}
                      </p>
                    </div>

                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center space-x-2 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Ganti Akun / Masuk Akun Lain</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-nav-login"
                onClick={onOpenAuthModal}
                className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                <span>Masuk</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center whitespace-nowrap px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 mr-1.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
