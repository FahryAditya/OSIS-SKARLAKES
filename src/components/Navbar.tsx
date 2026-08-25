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
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
        {/* Top bar info */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Brand and Organization info */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
              {config.logoUrl ? (
                <img 
                  src={config.logoUrl} 
                  alt={`Logo ${config.shortName}`} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-xs border border-slate-200 bg-white"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs font-bold text-sm sm:text-lg">
                  {config.shortName.slice(0, 2).toUpperCase() || <Building2 className="w-5 h-5" />}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight tracking-tight truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none">
                    {config.shortName || 'OSIS SKARLAKES'}
                  </span>
                  <span className="hidden xs:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    {config.period}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-md hidden xs:block">
                  {config.name}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons & Auth User */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              
              {/* Google Sheets Sync Button */}
              <button
                id="btn-nav-google-sheets"
                onClick={onOpenGoogleSheetsSync}
                className={`inline-flex items-center h-8 sm:h-9 px-2 sm:px-3 text-xs font-semibold rounded-lg border transition-all shadow-2xs ${
                  isGoogleSheetsConnected
                    ? 'bg-emerald-50/90 border-emerald-300/80 text-emerald-800 hover:bg-emerald-100'
                    : isGoogleSignedIn
                    ? 'bg-amber-50 border-amber-300/80 text-amber-800 hover:bg-amber-100'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={isGoogleSheetsConnected ? "Tersambung ke Google Sheets" : "Hubungkan Google Sheets"}
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  isGoogleSheetsConnected ? 'text-emerald-600' : 'text-slate-500'
                } sm:mr-1.5`} />
                <span className="hidden md:inline whitespace-nowrap">
                  {isGoogleSheetsConnected ? 'Sheets Terhubung' : 'Google Sheets'}
                </span>
                {isGoogleSheetsConnected && (
                  <span className="ml-1 sm:ml-2 flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>

              {/* Self check in button */}
              <button
                id="btn-nav-self-checkin"
                onClick={onOpenSelfCheckIn}
                className="inline-flex items-center h-8 sm:h-9 px-2 sm:px-3 border border-indigo-200 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-colors shadow-2xs"
                title="Presensi Mandiri Siswa (QR Code)"
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-indigo-600 mr-1 sm:mr-1.5" />
                <span className="hidden md:inline whitespace-nowrap">Presensi Mandiri</span>
                <span className="inline md:hidden whitespace-nowrap">Presensi</span>
              </button>

              {/* Quick transaction button */}
              <button
                id="btn-nav-quick-trans"
                onClick={onOpenQuickTransaction}
                className="inline-flex items-center h-8 sm:h-9 px-2.5 sm:px-3.5 border border-transparent text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-2xs"
                title="Catat Kas Cepat"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline whitespace-nowrap">Catat Kas</span>
                <span className="inline sm:hidden whitespace-nowrap">Kas</span>
              </button>

              {/* Authentication Button / User Profile Menu */}
              {currentUser ? (
                <div className="relative" ref={menuRef}>
                  <button
                    id="btn-user-profile-menu"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center h-8 sm:h-9 pl-1 pr-1.5 sm:pr-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-all shadow-2xs gap-1"
                  >
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Avatar" 
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-2xs sm:text-xs font-bold shadow-2xs shrink-0">
                        {userDisplayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left hidden xl:block">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[90px]">
                        {userDisplayName}
                      </p>
                    </div>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 sm:w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Akun Terverifikasi
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
                          {userDisplayName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {currentUser.email}
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
                  className="inline-flex items-center h-8 sm:h-9 px-2.5 sm:px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                  <span>Masuk</span>
                </button>
              )}

            </div>

          </div>
        </div>

        {/* Desktop & Mobile Top Scrollable Navigation tabs */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-t border-slate-100 relative">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5 sm:py-2 scrollbar-none touch-pan-x" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center whitespace-nowrap px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (For smartphones < 640px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1 px-2 flex justify-around items-center sm:hidden shadow-lg no-print">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'sekbid', label: '10 Sekbid', icon: Layers },
          { id: 'absensi', label: 'Presensi', icon: CalendarCheck },
          { id: 'keuangan', label: 'Buku Kas', icon: Wallet },
          { id: 'anggota', label: 'Anggota', icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={`mobile-bottom-${item.id}`}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
