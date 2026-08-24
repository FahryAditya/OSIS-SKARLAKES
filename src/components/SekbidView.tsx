import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Flag, 
  Trophy, 
  Leaf, 
  ShoppingBag, 
  HeartPulse, 
  BookOpen, 
  Laptop, 
  Globe, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Phone, 
  Mail, 
  Crown, 
  UserCheck, 
  Printer, 
  Download, 
  Layers,
  ArrowUpDown,
  BookMarked,
  RotateCcw,
  Check
} from 'lucide-react';
import { SekbidDetail, SekbidMember, SekbidRole, OrganizationConfig } from '../types';

interface SekbidViewProps {
  sekbidList: SekbidDetail[];
  members: SekbidMember[];
  config: OrganizationConfig;
  onAddMember: (member: Omit<SekbidMember, 'id'>) => void;
  onUpdateMember: (id: string, updated: Partial<SekbidMember>) => void;
  onDeleteMember: (id: string) => void;
  onUpdateSekbidDetail?: (id: number, updated: Partial<SekbidDetail>) => void;
  onResetSekbidData?: () => void;
}

const ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  ShieldCheck,
  Flag,
  Trophy,
  Leaf,
  ShoppingBag,
  HeartPulse,
  BookOpen,
  Laptop,
  Globe,
};

const THEME_STYLES: Record<string, {
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  text: string;
  accent: string;
  headerGrad: string;
}> = {
  emerald: {
    bgLight: 'bg-emerald-50/60',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    accent: 'bg-emerald-600',
    headerGrad: 'from-emerald-600 to-teal-700',
  },
  blue: {
    bgLight: 'bg-blue-50/60',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    border: 'border-blue-200',
    text: 'text-blue-700',
    accent: 'bg-blue-600',
    headerGrad: 'from-blue-600 to-indigo-700',
  },
  red: {
    bgLight: 'bg-rose-50/60',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    border: 'border-rose-200',
    text: 'text-rose-700',
    accent: 'bg-rose-600',
    headerGrad: 'from-rose-600 to-red-700',
  },
  amber: {
    bgLight: 'bg-amber-50/60',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    border: 'border-amber-200',
    text: 'text-amber-700',
    accent: 'bg-amber-600',
    headerGrad: 'from-amber-600 to-orange-700',
  },
  teal: {
    bgLight: 'bg-teal-50/60',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    border: 'border-teal-200',
    text: 'text-teal-700',
    accent: 'bg-teal-600',
    headerGrad: 'from-teal-600 to-emerald-700',
  },
  violet: {
    bgLight: 'bg-violet-50/60',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-800',
    border: 'border-violet-200',
    text: 'text-violet-700',
    accent: 'bg-violet-600',
    headerGrad: 'from-violet-600 to-purple-700',
  },
  rose: {
    bgLight: 'bg-pink-50/60',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    border: 'border-pink-200',
    text: 'text-pink-700',
    accent: 'bg-pink-600',
    headerGrad: 'from-pink-600 to-rose-700',
  },
  indigo: {
    bgLight: 'bg-indigo-50/60',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    accent: 'bg-indigo-600',
    headerGrad: 'from-indigo-600 to-sky-700',
  },
  cyan: {
    bgLight: 'bg-cyan-50/60',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    accent: 'bg-cyan-600',
    headerGrad: 'from-cyan-600 to-blue-700',
  },
  orange: {
    bgLight: 'bg-orange-50/60',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    border: 'border-orange-200',
    text: 'text-orange-700',
    accent: 'bg-orange-600',
    headerGrad: 'from-orange-600 to-amber-700',
  },
};

export const SekbidView: React.FC<SekbidViewProps> = ({
  sekbidList,
  members,
  config,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onUpdateSekbidDetail,
  onResetSekbidData,
}) => {
  // Navigation / Filter State
  const [selectedSekbidId, setSelectedSekbidId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | SekbidRole>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal State for Member CRUD
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<SekbidMember | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formSekbidId, setFormSekbidId] = useState<number>(1);
  const [formRole, setFormRole] = useState<SekbidRole>('Anggota');
  const [formGradeClass, setFormGradeClass] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTask, setFormTask] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Modal State for Edit Sekbid Info
  const [isSekbidModalOpen, setIsSekbidModalOpen] = useState(false);
  const [editingSekbid, setEditingSekbid] = useState<SekbidDetail | null>(null);
  const [sekbidTitle, setSekbidTitle] = useState('');
  const [sekbidShortTitle, setSekbidShortTitle] = useState('');
  const [sekbidDesc, setSekbidDesc] = useState('');
  const [sekbidProkers, setSekbidProkers] = useState<string>('');

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<SekbidMember | null>(null);

  // Open Add Member
  const handleOpenAddMember = (defaultSekbidId?: number) => {
    setEditingMember(null);
    setFormName('');
    setFormNis('');
    setFormSekbidId(defaultSekbidId || (selectedSekbidId !== 'all' ? selectedSekbidId : 1));
    setFormRole('Anggota');
    setFormGradeClass('');
    setFormPhone('');
    setFormEmail('');
    setFormTask('');
    setFormStatus('Aktif');
    setIsMemberModalOpen(true);
  };

  // Open Edit Member
  const handleOpenEditMember = (member: SekbidMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormNis(member.nis);
    setFormSekbidId(member.sekbidId);
    setFormRole(member.role);
    setFormGradeClass(member.gradeClass);
    setFormPhone(member.phone);
    setFormEmail(member.email || '');
    setFormTask(member.taskOrFocus || '');
    setFormStatus(member.status);
    setIsMemberModalOpen(true);
  };

  // Save Member
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingMember) {
      onUpdateMember(editingMember.id, {
        name: formName.trim(),
        nis: formNis.trim(),
        sekbidId: Number(formSekbidId),
        role: formRole,
        gradeClass: formGradeClass.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        taskOrFocus: formTask.trim() || undefined,
        status: formStatus,
      });
    } else {
      onAddMember({
        name: formName.trim(),
        nis: formNis.trim(),
        sekbidId: Number(formSekbidId),
        role: formRole,
        gradeClass: formGradeClass.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        taskOrFocus: formTask.trim() || undefined,
        status: formStatus,
        joinedPeriod: config.period || '2025/2026',
      });
    }

    setIsMemberModalOpen(false);
  };

  // Open Edit Sekbid Detail
  const handleOpenEditSekbid = (sekbid: SekbidDetail) => {
    setEditingSekbid(sekbid);
    setSekbidTitle(sekbid.title);
    setSekbidShortTitle(sekbid.shortTitle);
    setSekbidDesc(sekbid.description);
    setSekbidProkers(sekbid.prokerList.join('\n'));
    setIsSekbidModalOpen(true);
  };

  const handleSaveSekbidDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSekbid || !onUpdateSekbidDetail) return;
    const prokerArray = sekbidProkers
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    onUpdateSekbidDetail(editingSekbid.id, {
      title: sekbidTitle.trim(),
      shortTitle: sekbidShortTitle.trim(),
      description: sekbidDesc.trim(),
      prokerList: prokerArray,
    });
    setIsSekbidModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Sekbid ID', 'Nama Sekbid', 'Nama Lengkap', 'NIS / NISN', 'Jabatan', 'Kelas', 'No. WhatsApp', 'Email', 'Tugas / Fokus', 'Status'];
    const rows = members.map((m) => {
      const s = sekbidList.find((x) => x.id === m.sekbidId);
      return [
        m.id,
        `SEKBID ${m.sekbidId}`,
        s ? `"${s.shortTitle}"` : '',
        `"${m.name}"`,
        m.nis,
        m.role,
        m.gradeClass,
        m.phone,
        m.email || '',
        `"${m.taskOrFocus || ''}"`,
        m.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_10_Sekbid_OSIS_${config.shortName || 'Organisasi'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedSekbidId !== 'all' && m.sekbidId !== selectedSekbidId) return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sekbidObj = sekbidList.find((s) => s.id === m.sekbidId);
        const matchName = m.name.toLowerCase().includes(q);
        const matchNis = m.nis.toLowerCase().includes(q);
        const matchClass = m.gradeClass.toLowerCase().includes(q);
        const matchTask = (m.taskOrFocus || '').toLowerCase().includes(q);
        const matchSekbid = sekbidObj ? sekbidObj.title.toLowerCase().includes(q) || sekbidObj.shortTitle.toLowerCase().includes(q) : false;
        return matchName || matchNis || matchClass || matchTask || matchSekbid;
      }
      return true;
    });
  }, [members, selectedSekbidId, roleFilter, searchQuery, sekbidList]);

  // Statistics
  const totalKetua = members.filter((m) => m.role === 'Ketua Sekbid').length;
  const totalWakil = members.filter((m) => m.role === 'Wakil Ketua Sekbid').length;
  const totalAnggota = members.filter((m) => m.role === 'Anggota').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Struktur 10 Seksi Bidang OSIS
              </span>
              <span className="text-xs text-slate-500 font-medium">Periode {config.period}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Daftar Pengurus 10 Sekbid OSIS
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Kelola struktur kepengurusan 10 Seksi Bidang (Sekbid) OSIS secara lengkap: Ketua, Wakil Ketua, dan Anggota aktif dengan program kerja terintegrasi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-csv-sekbid"
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
              title="Unduh Data CSV"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Export CSV
            </button>

            <button
              id="btn-print-sekbid"
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
              title="Cetak Struktur"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Cetak
            </button>

            {onResetSekbidData && (
              <button
                id="btn-reset-sekbid"
                onClick={() => {
                  if (window.confirm('Kembalikan data 10 Sekbid OSIS ke susunan standar awal?')) {
                    onResetSekbidData();
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-amber-200 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 shadow-2xs transition-colors"
                title="Reset ke Standar 10 Sekbid"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Reset Standar
              </button>
            )}

            <button
              id="btn-add-sekbid-member-top"
              onClick={() => handleOpenAddMember()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Tambah Anggota Sekbid
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Total Seksi Bidang</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-slate-800">10 Sekbid</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-100">
            <span className="text-xs font-medium text-amber-800">Ketua Sekbid</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-amber-900">{totalKetua} / 10</span>
              <Crown className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="bg-indigo-50/60 rounded-lg p-3 border border-indigo-100">
            <span className="text-xs font-medium text-indigo-800">Wakil Ketua Sekbid</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-indigo-900">{totalWakil} / 10</span>
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-100">
            <span className="text-xs font-medium text-emerald-800">Total Anggota Sekbid</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-emerald-900">{members.length} Orang</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 10 Sekbid Navigation Pills */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pilih Seksi Bidang (Sekbid 1 - 10):
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Klik nomor sekbid untuk filter atau fokus
          </span>
        </div>

        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="pill-sekbid-all"
            onClick={() => setSelectedSekbidId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedSekbidId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua (10 Sekbid)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
              {members.length}
            </span>
          </button>

          {sekbidList.map((s) => {
            const isSelected = selectedSekbidId === s.id;
            const count = members.filter((m) => m.sekbidId === s.id).length;
            const style = THEME_STYLES[s.themeColor] || THEME_STYLES.indigo;
            const IconComp = ICONS_MAP[s.iconName] || Users;

            return (
              <button
                key={s.id}
                id={`pill-sekbid-${s.id}`}
                onClick={() => setSelectedSekbidId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 border ${
                  isSelected
                    ? `${style.accent} text-white border-transparent shadow-xs font-semibold`
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title={s.title}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : style.text}`} />
                <span>Sekbid {s.number}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-sekbid"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pengurus, NISN, kelas, tugas khusus, atau program kerja..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium px-2">Jabatan:</span>
              {(['all', 'Ketua Sekbid', 'Wakil Ketua Sekbid', 'Anggota'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    roleFilter === r
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'all' ? 'Semua' : r.replace(' Sekbid', '')}
                </button>
              ))}
            </div>

            <div className="border-l border-slate-200 pl-2 hidden sm:flex items-center space-x-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilan Kartu Struktur"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedSekbidId === 'all' && searchQuery === '' && roleFilter === 'all' && viewMode === 'cards' ? (
        /* 10 SEKBID FULL OVERVIEW GRID */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sekbidList.map((sekbid) => {
              const sekbidMembers = members.filter((m) => m.sekbidId === sekbid.id);
              const ketua = sekbidMembers.find((m) => m.role === 'Ketua Sekbid');
              const wakil = sekbidMembers.find((m) => m.role === 'Wakil Ketua Sekbid');
              const anggotaList = sekbidMembers.filter((m) => m.role === 'Anggota');
              const style = THEME_STYLES[sekbid.themeColor] || THEME_STYLES.indigo;
              const IconComp = ICONS_MAP[sekbid.iconName] || Users;

              return (
                <div
                  key={sekbid.id}
                  id={`sekbid-card-${sekbid.id}`}
                  className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md"
                >
                  {/* Sekbid Header */}
                  <div className={`p-4 bg-gradient-to-r ${style.headerGrad} text-white`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 bg-white/15 backdrop-blur-xs rounded-xl shadow-xs">
                          <IconComp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                              {sekbid.code}
                            </span>
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                              {sekbidMembers.length} Pengurus
                            </span>
                          </div>
                          <h3 className="text-base font-bold leading-snug mt-1">
                            {sekbid.shortTitle}
                          </h3>
                          <p className="text-xs text-white/90 line-clamp-2 mt-0.5">
                            {sekbid.title}
                          </p>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center space-x-1">
                        <button
                          id={`btn-edit-sekbid-desc-${sekbid.id}`}
                          onClick={() => handleOpenEditSekbid(sekbid)}
                          className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors"
                          title="Edit Deskripsi & Program Kerja Sekbid"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-add-member-to-sekbid-${sekbid.id}`}
                          onClick={() => handleOpenAddMember(sekbid.id)}
                          className="p-1.5 bg-white text-slate-800 hover:bg-slate-100 rounded-lg font-medium text-xs flex items-center shadow-xs transition-colors"
                          title="Tambah Anggota ke Sekbid ini"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body: Struktur Ketua, Wakil, & Anggota */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    {/* Ketua & Wakil Roster */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Ketua Box */}
                      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 relative group">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            <Crown className="w-3 h-3 mr-1 text-amber-600" />
                            Ketua Sekbid
                          </span>
                          {ketua && (
                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => handleOpenEditMember(ketua)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(ketua)}
                                className="p-1 text-slate-500 hover:text-rose-600 rounded"
                                title="Hapus"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {ketua ? (
                          <div className="mt-1.5">
                            <h4 className="text-sm font-bold text-slate-900">{ketua.name}</h4>
                            <div className="flex items-center space-x-2 text-xs text-slate-600 mt-0.5">
                              <span className="font-medium bg-amber-100/80 px-1.5 py-0.2 rounded text-[11px] text-amber-900">
                                {ketua.gradeClass || 'Kelas -'}
                              </span>
                              <span>NIS: {ketua.nis || '-'}</span>
                            </div>
                            {ketua.taskOrFocus && (
                              <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                                📌 {ketua.taskOrFocus}
                              </p>
                            )}
                            {ketua.phone && (
                              <a
                                href={`https://wa.me/${ketua.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-[11px] text-emerald-700 hover:underline mt-1 font-medium"
                              >
                                <Phone className="w-2.5 h-2.5 mr-1" />
                                {ketua.phone}
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 py-2 text-center border border-dashed border-amber-300 rounded bg-white/50">
                            <p className="text-xs text-amber-700 italic">Belum ada Ketua Sekbid</p>
                            <button
                              onClick={() => {
                                handleOpenAddMember(sekbid.id);
                                setFormRole('Ketua Sekbid');
                              }}
                              className="mt-1 text-[11px] text-amber-800 font-semibold underline"
                            >
                              + Tunjuk Ketua
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Wakil Box */}
                      <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 relative group">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                            <UserCheck className="w-3 h-3 mr-1 text-indigo-600" />
                            Wakil Ketua
                          </span>
                          {wakil && (
                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => handleOpenEditMember(wakil)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(wakil)}
                                className="p-1 text-slate-500 hover:text-rose-600 rounded"
                                title="Hapus"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {wakil ? (
                          <div className="mt-1.5">
                            <h4 className="text-sm font-bold text-slate-900">{wakil.name}</h4>
                            <div className="flex items-center space-x-2 text-xs text-slate-600 mt-0.5">
                              <span className="font-medium bg-indigo-100/80 px-1.5 py-0.2 rounded text-[11px] text-indigo-900">
                                {wakil.gradeClass || 'Kelas -'}
                              </span>
                              <span>NIS: {wakil.nis || '-'}</span>
                            </div>
                            {wakil.taskOrFocus && (
                              <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                                📌 {wakil.taskOrFocus}
                              </p>
                            )}
                            {wakil.phone && (
                              <a
                                href={`https://wa.me/${wakil.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-[11px] text-emerald-700 hover:underline mt-1 font-medium"
                              >
                                <Phone className="w-2.5 h-2.5 mr-1" />
                                {wakil.phone}
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 py-2 text-center border border-dashed border-indigo-300 rounded bg-white/50">
                            <p className="text-xs text-indigo-700 italic">Belum ada Wakil Sekbid</p>
                            <button
                              onClick={() => {
                                handleOpenAddMember(sekbid.id);
                                setFormRole('Wakil Ketua Sekbid');
                              }}
                              className="mt-1 text-[11px] text-indigo-800 font-semibold underline"
                            >
                              + Tunjuk Wakil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Anggota List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Anggota Sekbid ({anggotaList.length})
                        </span>
                        <button
                          onClick={() => {
                            handleOpenAddMember(sekbid.id);
                            setFormRole('Anggota');
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          + Tambah Anggota
                        </button>
                      </div>

                      {anggotaList.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {anggotaList.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors group"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-slate-800 leading-none block">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {m.gradeClass} {m.taskOrFocus ? `• ${m.taskOrFocus}` : ''}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                                {m.phone && (
                                  <a
                                    href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                                    title="Hubungi WA"
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleOpenEditMember(m)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                  title="Edit"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(m)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2">
                          Belum ada staf anggota terdaftar.
                        </p>
                      )}
                    </div>

                    {/* Proker Accordion Preview */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="font-semibold text-slate-600">Program Kerja Unggulan:</span>
                        <button
                          onClick={() => setSelectedSekbidId(sekbid.id)}
                          className="text-indigo-600 hover:underline flex items-center text-[11px] font-medium"
                        >
                          Lihat Detail <ChevronRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {sekbid.prokerList.slice(0, 2).map((pk, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium truncate max-w-[260px]"
                          >
                            • {pk}
                          </span>
                        ))}
                        {sekbid.prokerList.length > 2 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{sekbid.prokerList.length - 2} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* FILTERED / SINGLE SEKBID / TABLE / SEARCH RESULTS VIEW */
        <div className="space-y-6">
          {/* If single Sekbid selected, show Sekbid Detail Card */}
          {selectedSekbidId !== 'all' && (
            (() => {
              const sekbid = sekbidList.find((s) => s.id === selectedSekbidId);
              if (!sekbid) return null;
              const style = THEME_STYLES[sekbid.themeColor] || THEME_STYLES.indigo;
              const IconComp = ICONS_MAP[sekbid.iconName] || Users;
              const sekbidMembers = members.filter((m) => m.sekbidId === sekbid.id);

              return (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className={`p-6 bg-gradient-to-r ${style.headerGrad} text-white`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-xs shadow-sm">
                          <IconComp className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                              {sekbid.code}
                            </span>
                            <span className="text-xs bg-white/25 px-2.5 py-0.5 rounded-full font-semibold">
                              {sekbidMembers.length} Pengurus Terdaftar
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold mt-1">{sekbid.shortTitle}</h2>
                          <p className="text-sm text-white/95 mt-0.5">{sekbid.title}</p>
                          <p className="text-xs text-white/80 mt-2 max-w-2xl">{sekbid.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditSekbid(sekbid)}
                          className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors flex items-center"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" />
                          Edit Info Sekbid
                        </button>
                        <button
                          onClick={() => handleOpenAddMember(sekbid.id)}
                          className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                          Tambah Pengurus
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Program Kerja Tabs / Badges */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                      <BookMarked className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      Program Kerja Unggulan {sekbid.code}:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {sekbid.prokerList.map((proker, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 flex items-start space-x-2 shadow-2xs"
                        >
                          <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="font-medium leading-relaxed">{proker}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* Members Table / Grid */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Anggota Pengurus
                  {selectedSekbidId !== 'all' && ` Sekbid ${selectedSekbidId}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan {filteredMembers.length} orang pengurus sesuai filter pencarian
                </p>
              </div>

              <button
                onClick={() => handleOpenAddMember(selectedSekbidId !== 'all' ? selectedSekbidId : 1)}
                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Anggota
              </button>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pengurus</th>
                      <th className="py-3 px-4">Seksi Bidang</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Kelas / Tingkat</th>
                      <th className="py-3 px-4">Tugas / Fokus</th>
                      <th className="py-3 px-4">Kontak</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredMembers.map((m) => {
                      const sekbid = sekbidList.find((s) => s.id === m.sekbidId);
                      const style = sekbid ? THEME_STYLES[sekbid.themeColor] : THEME_STYLES.indigo;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Nama & NIS */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block leading-snug">
                                  {m.name}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                  NIS: {m.nis || '-'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Sekbid */}
                          <td className="py-3.5 px-4">
                            {sekbid ? (
                              <div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${style?.badgeBg || 'bg-slate-100'} ${style?.badgeText || 'text-slate-800'}`}>
                                  {sekbid.code}
                                </span>
                                <span className="text-xs text-slate-600 block mt-0.5 font-medium">
                                  {sekbid.shortTitle}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Sekbid {m.sekbidId}</span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            {m.role === 'Ketua Sekbid' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <Crown className="w-3 h-3 mr-1 text-amber-600" />
                                Ketua Sekbid
                              </span>
                            ) : m.role === 'Wakil Ketua Sekbid' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                <UserCheck className="w-3 h-3 mr-1 text-indigo-600" />
                                Wakil Ketua
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                Anggota
                              </span>
                            )}
                          </td>

                          {/* Kelas */}
                          <td className="py-3.5 px-4 font-medium text-slate-800 text-xs">
                            {m.gradeClass || '-'}
                          </td>

                          {/* Tugas */}
                          <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                            {m.taskOrFocus ? (
                              <span className="bg-slate-100 px-2 py-1 rounded inline-block">
                                {m.taskOrFocus}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Kontak */}
                          <td className="py-3.5 px-4 text-xs">
                            <div className="space-y-1">
                              {m.phone && (
                                <a
                                  href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-emerald-700 hover:underline font-medium"
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  {m.phone}
                                </a>
                              )}
                              {m.email && (
                                <div className="text-slate-500 text-[11px] truncate max-w-[150px]">
                                  {m.email}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                m.status === 'Aktif'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                id={`btn-edit-member-${m.id}`}
                                onClick={() => handleOpenEditMember(m)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                title="Edit Anggota"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-member-${m.id}`}
                                onClick={() => setDeleteTarget(m)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
                                title="Hapus Anggota"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h4 className="text-base font-bold text-slate-700">Tidak ada pengurus ditemukan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian, filter sekbid, atau tambahkan pengurus baru.
                </p>
                <button
                  onClick={() => handleOpenAddMember(selectedSekbidId !== 'all' ? selectedSekbidId : 1)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Tambah Pengurus Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT ANGGOTA SEKBID ================= */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/30 rounded-lg">
                  {editingMember ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingMember ? 'Edit Anggota Pengurus Sekbid' : 'Tambah Anggota Pengurus Sekbid'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Masukkan data lengkap anggota pengurus OSIS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi Rahman"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Sekbid & Jabatan (2 Col) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Seksi Bidang (Sekbid) *
                  </label>
                  <select
                    value={formSekbidId}
                    onChange={(e) => setFormSekbidId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {sekbidList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.shortTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Jabatan di Sekbid *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as SekbidRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
                  >
                    <option value="Ketua Sekbid">👑 Ketua Sekbid (Koordinator)</option>
                    <option value="Wakil Ketua Sekbid">🤝 Wakil Ketua Sekbid</option>
                    <option value="Anggota">👤 Anggota Sekbid</option>
                  </select>
                </div>
              </div>

              {/* NIS / NISN & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    NIS / NISN
                  </label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="Contoh: 1023401"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Kelas / Tingkat
                  </label>
                  <input
                    type="text"
                    value={formGradeClass}
                    onChange={(e) => setFormGradeClass(e.target.value)}
                    placeholder="Contoh: XI MIPA 1 / X-2"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Email Siswa (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@sekolah.sch.id"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tugas Khusus / Tanggung Jawab */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Tugas Khusus / Tanggung Jawab Proker
                </label>
                <input
                  type="text"
                  value={formTask}
                  onChange={(e) => setFormTask(e.target.value)}
                  placeholder="Contoh: PJ PHBI & Sholat Berjamaah / Sie Dokumentasi"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Status Keaktifan
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Aktif"
                      checked={formStatus === 'Aktif'}
                      onChange={() => setFormStatus('Aktif')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Nonaktif"
                      checked={formStatus === 'Nonaktif'}
                      onChange={() => setFormStatus('Nonaktif')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Nonaktif</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {editingMember ? 'Simpan Perubahan' : 'Tambahkan Pengurus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT INFO SEKBID & PROKER ================= */}
      {isSekbidModalOpen && editingSekbid && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/30 rounded-lg">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Edit Informasi {editingSekbid.code}</h3>
                  <p className="text-xs text-slate-300">Ubah nama, deskripsi tugas, dan program kerja</p>
                </div>
              </div>
              <button
                onClick={() => setIsSekbidModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSekbidDetail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Singkat Sekbid *
                </label>
                <input
                  type="text"
                  required
                  value={sekbidShortTitle}
                  onChange={(e) => setSekbidShortTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Resmi Sekbid *
                </label>
                <input
                  type="text"
                  required
                  value={sekbidTitle}
                  onChange={(e) => setSekbidTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Deskripsi / Ruang Lingkup Pembinaan
                </label>
                <textarea
                  rows={3}
                  value={sekbidDesc}
                  onChange={(e) => setSekbidDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Daftar Program Kerja Unggulan (1 baris per proker)
                </label>
                <textarea
                  rows={4}
                  value={sekbidProkers}
                  onChange={(e) => setSekbidProkers(e.target.value)}
                  placeholder="Contoh:&#10;Peringatan Hari Besar Keagamaan&#10;Kajian Rutin Jumat&#10;Bakti Sosial Ramadhan"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSekbidModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Simpan Info Sekbid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Anggota Sekbid?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget.name}</strong> ({deleteTarget.role}) dari data Sekbid {deleteTarget.sekbidId}?
            </p>
            <div className="mt-5 flex items-center justify-center space-x-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteMember(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
