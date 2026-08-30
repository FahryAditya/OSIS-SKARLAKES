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
  Database,
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
    { id: 'updates', label: 'Riwayat Update', icon: Sparkles },
  ];

  // Session and profile data are memory-only; synthetic admin users expose role directly.
  const userRole = (currentUser as (User & { role?: string }) | null)?.role || 'Pengurus OSIS';
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengurus OSIS';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
        {/* Top bar info */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Brand and Organization info */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
              <img 
                src={config.logoUrl || '/logo.png'} 
                alt={`Logo ${config.shortName}`} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-xs border border-slate-200 bg-white"
              />
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
              
              {/* NeonDB Cloud Status Indicator */}
              <div 
                id="indicator-nav-neondb"
                className="inline-flex items-center h-8 sm:h-9 px-2 sm:px-3 text-xs font-semibold rounded-lg border bg-emerald-50/90 border-emerald-300/80 text-emerald-800 shadow-2xs cursor-default"
                title="Tersambung ke NeonDB PostgreSQL Cloud"
              >
                <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 sm:mr-1.5 shrink-0" />
                <span className="hidden md:inline whitespace-nowrap">
                  NeonDB Cloud
                </span>
                <span className="ml-1 sm:ml-2 flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

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
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <p className="text-xs font-bold text-slate-900 truncate">{userDisplayName}</p>
                        </div>
                        <p className="text-2xs text-slate-500 font-mono mt-0.5 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-3xs rounded-md">
                          {userRole}
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setActiveTab('pengaturan');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Pengaturan Organisasi</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Keluar Akun (Logout)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="btn-nav-login"
                  onClick={onOpenAuthModal}
                  className="inline-flex items-center h-8 sm:h-9 px-3 sm:px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Login Pengurus</span>
                </button>
              )}

            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-slate-100 bg-slate-50/50">
          <nav className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-2 shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
};
