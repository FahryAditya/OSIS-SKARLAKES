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
  Sparkles,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const userRole = (currentUser as (User & { role?: string }) | null)?.role || 'Pengurus OSIS';
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengurus OSIS';

  return (
    <>
      {/* ================= MOBILE HEADER (BARIS ATAS UNTUK HP) ================= */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs no-print">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <img 
            src={config.logoUrl || '/logo.png'} 
            alt={`Logo ${config.shortName}`} 
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-xl object-cover border border-slate-200 bg-white"
          />
          <div>
            <span className="font-extrabold text-slate-900 text-sm leading-tight block">
              {config.shortName || 'OSIS SKARLAKES'}
            </span>
            <span className="text-[10px] text-slate-500 block">{config.period}</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle Menu Navigasi"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* ================= DESKTOP LEFT SIDEBAR ================= */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out no-print
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0 shrink-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Top Header / Branding */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => {
              setActiveTab('dashboard');
              setIsMobileMenuOpen(false);
            }}>
              <img 
                src={config.logoUrl || '/logo.png'} 
                alt={`Logo ${config.shortName}`} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover shadow-xs border border-slate-200 bg-white shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-extrabold text-slate-900 text-base leading-tight tracking-tight truncate">
                    {config.shortName || 'OSIS SKARLAKES'}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {config.name}
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Periode {config.period}
            </span>

            {/* NeonDB Status */}
            <div 
              id="indicator-nav-neondb"
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border bg-emerald-50 border-emerald-200 text-emerald-800"
              title="Tersambung ke NeonDB Cloud"
            >
              <Database className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
              <span>NeonDB</span>
              <span className="ml-1.5 flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Bar */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
          <button
            id="btn-nav-self-checkin"
            onClick={() => {
              onOpenSelfCheckIn();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-indigo-200 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-colors shadow-2xs"
            title="Presensi Mandiri Siswa (QR Code)"
          >
            <QrCode className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Presensi Mandiri (QR)</span>
          </button>

          <button
            id="btn-nav-quick-trans"
            onClick={() => {
              onOpenQuickTransaction();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-transparent text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-2xs"
            title="Catat Kas Cepat"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Catat Kas Cepat</span>
          </button>
        </div>

        {/* Navigation Items (Side Menu) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-none">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Menu Utama Organisasi
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom User Account Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                    {userDisplayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate font-mono">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2">
                <button
                  onClick={() => {
                    setActiveTab('pengaturan');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pengaturan</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-700 flex items-center justify-center space-x-1 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              id="btn-nav-login"
              onClick={() => {
                onOpenAuthModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
            >
              <LogIn className="w-4 h-4 text-indigo-300" />
              <span>Login Pengurus OSIS</span>
            </button>
          )}
        </div>
      </aside>

      {/* Overlay Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}
    </>
  );
};
