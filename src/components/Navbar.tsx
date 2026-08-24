import React from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { ActiveTab, OrganizationConfig } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: OrganizationConfig;
  onOpenSelfCheckIn: () => void;
  onOpenQuickTransaction: () => void;
  onOpenGoogleSheetsSync: () => void;
  isGoogleSheetsConnected: boolean;
  isGoogleSignedIn: boolean;
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
}) => {
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
              <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {config.name}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Google Sheets Sync Button */}
            <button
              id="btn-nav-google-sheets"
              onClick={onOpenGoogleSheetsSync}
              className={`inline-flex items-center px-3 py-2 border text-xs sm:text-sm font-medium rounded-lg transition-all shadow-2xs ${
                isGoogleSheetsConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : isGoogleSignedIn
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Kelola Database Google Sheets"
            >
              <FileSpreadsheet className={`w-4 h-4 mr-1.5 ${
                isGoogleSheetsConnected ? 'text-emerald-600' : 'text-emerald-500'
              }`} />
              <span className="hidden md:inline">
                {isGoogleSheetsConnected ? 'Google Sheets' : 'Database Sheets'}
              </span>
              {isGoogleSheetsConnected && (
                <span className="ml-1.5 flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            <button
              id="btn-nav-self-checkin"
              onClick={onOpenSelfCheckIn}
              className="inline-flex items-center px-3 py-2 border border-indigo-200 text-xs sm:text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <QrCode className="w-4 h-4 mr-1.5 text-indigo-600" />
              <span className="hidden sm:inline">Presensi Mandiri</span>
              <span className="sm:hidden">Presensi</span>
            </button>

            <button
              id="btn-nav-quick-trans"
              onClick={onOpenQuickTransaction}
              className="inline-flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Catat Kas</span>
              <span className="sm:hidden">Catat</span>
            </button>
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
