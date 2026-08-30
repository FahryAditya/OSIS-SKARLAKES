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
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Rocket,
  Menu,
  X
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sekbid', label: '10 Sekbid OSIS', icon: Layers },
    { id: 'absensi', label: 'Presensi & QR Code', icon: CalendarCheck },
    { id: 'keuangan', label: 'Buku Kas Umum', icon: Wallet },
    { id: 'iuran', label: 'Iuran Kas Anggota', icon: Coins },
    { id: 'laporan', label: 'Laporan Resmi', icon: FileText },
    { id: 'anggota', label: 'Direktori Anggota', icon: Users },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
    { id: 'upcoming', label: 'List Update (Akan Tiba)', icon: Rocket },
    { id: 'updates', label: 'Riwayat Update', icon: Sparkles },
  ];

  const userRole = (currentUser as (User & { role?: string }) | null)?.role || 'Pengurus OSIS';
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengurus OSIS';

  const currentTabLabel = navItems.find(item => item.id === activeTab)?.label || 'Dashboard';

  const handleTabClick = (id: ActiveTab) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* ─── DESKTOP LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 bg-white border-r border-slate-200/90 z-40 flex-col justify-between p-5 overflow-y-auto no-print">
        <div className="space-y-6">
          
          {/* Brand Logo & Info */}
          <div 
            className="flex items-center space-x-3 cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition-colors"
            onClick={() => handleTabClick('dashboard')}
          >
            <img 
              src={config.logoUrl || '/logo.png'} 
              alt={`Logo ${config.shortName}`} 
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-2xl object-cover shadow-sm border border-slate-200 bg-white shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-slate-900 text-base leading-tight tracking-tight truncate">
                  {config.shortName || 'OSIS SKARLAKES'}
                </span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 mt-0.5">
                {config.period}
              </span>
            </div>
          </div>

          {/* Navigation Items (Vertical List) */}
          <nav className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Menu Utama
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Footer Section */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          
          {/* NeonDB Status Indicator */}
          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-2xs font-bold text-emerald-900">NeonDB Cloud</span>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* User Account Bar */}
          {currentUser ? (
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center space-x-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {userDisplayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{userDisplayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{userRole}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors"
            >
              <LogIn className="w-4 h-4 text-indigo-300" />
              <span>Login Pengurus</span>
            </button>
          )}

        </div>
      </aside>

      {/* ─── MOBILE DRAWER & OVERLAY ───────────────────────────────────────────────── */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <img src={config.logoUrl || '/logo.png'} alt="Logo" className="w-8 h-8 rounded-lg" />
                  <span className="font-bold text-slate-900 text-sm">{config.shortName || 'OSIS SKARLAKES'}</span>
                </div>
                <button onClick={() => setIsMobileOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 ${
                        isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {currentUser ? (
                <button
                  onClick={onLogout}
                  className="w-full py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                >
                  Login Pengurus
                </button>
              )}
            </div>

          </div>
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* ─── TOP HEADER BAR (Shifted Right on Desktop) ─────────────────────────────── */}
      <header className="lg:pl-64 xl:pl-72 fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between no-print">
        
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OSIS SKARLAKES</span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-none mt-0.5">
              {currentTabLabel}
            </h2>
          </div>
        </div>

        {/* Right: Quick Action Buttons & Profile Dropdown */}
        <div className="flex items-center space-x-2">
          
          <button
            id="btn-nav-self-checkin"
            onClick={onOpenSelfCheckIn}
            className="inline-flex items-center h-9 px-3 border border-indigo-200 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-all shadow-2xs"
            title="Presensi Mandiri Siswa (QR Code)"
          >
            <QrCode className="w-4 h-4 shrink-0 text-indigo-600 mr-1.5" />
            <span className="hidden sm:inline">Presensi Mandiri</span>
          </button>

          <button
            id="btn-nav-quick-trans"
            onClick={onOpenQuickTransaction}
            className="inline-flex items-center h-9 px-3.5 border border-transparent text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/25"
            title="Catat Kas Cepat"
          >
            <PlusCircle className="w-4 h-4 shrink-0 mr-1.5" />
            <span className="hidden sm:inline">Catat Kas</span>
          </button>

          {/* User Profile Menu */}
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                id="btn-user-profile-menu"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center h-9 pl-1.5 pr-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs gap-1.5"
              >
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Avatar" 
                    className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {userDisplayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline font-bold text-slate-800 max-w-[100px] truncate">
                  {userDisplayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
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
                        handleTabClick('pengaturan');
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
              className="inline-flex items-center h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs space-x-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-300" />
              <span>Login</span>
            </button>
          )}

        </div>

      </header>
    </>
  );
};

