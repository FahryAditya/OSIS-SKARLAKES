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
  Check,
  GripVertical,
  ArrowRightLeft,
  MoveRight,
  UploadCloud,
  RefreshCw
} from 'lucide-react';
import { SekbidDetail, SekbidMember, SekbidRole, OrganizationConfig } from '../types';

interface SekbidViewProps {
  sekbidList: SekbidDetail[];
  members: SekbidMember[];
  config: OrganizationConfig;
  onAddMember: (member: Omit<SekbidMember, 'id'>) => void;
  onUpdateMember: (id: string, updated: Partial<SekbidMember>) => void;
  onDeleteMember: (id: string) => void;
  onUpdateSekbid?: (id: number, updated: Partial<SekbidDetail>) => void;
  onUpdateSekbidDetail?: (id: number, updated: Partial<SekbidDetail>) => void;
  onResetData?: () => void;
  onResetSekbidData?: () => void;
  onSyncSheets?: () => void;
  isSyncing?: boolean;
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
  sekbidList = [],
  members = [],
  config,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onUpdateSekbid,
  onUpdateSekbidDetail,
  onResetSekbidData,
  onSyncSheets,
  isSyncing = false,
}) => {
  const safeSekbidList = Array.isArray(sekbidList) ? sekbidList : [];
  const safeMembers = Array.isArray(members) ? members : [];
  // Keep the legacy prop working while using the explicit callback name in App.
  const updateSekbidDetail = onUpdateSekbidDetail || onUpdateSekbid;
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

  // Drag and Drop & Quick Transfer State
  const [draggedMember, setDraggedMember] = useState<SekbidMember | null>(null);
  const [dragOverSekbidId, setDragOverSekbidId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    id: string;
    text: string;
    memberId: string;
    prevSekbidId: number;
    prevRole: SekbidRole;
  } | null>(null);
  const [quickMoveMember, setQuickMoveMember] = useState<SekbidMember | null>(null);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, member: SekbidMember) => {
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify(member));
    } catch {
      // ignore
    }
    e.dataTransfer.effectAllowed = 'move';
    setDraggedMember(member);
  };

  const handleDragOver = (e: React.DragEvent, targetSekbidId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSekbidId !== targetSekbidId) {
      setDragOverSekbidId(targetSekbidId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetSekbidId: number) => {
    const related = e.relatedTarget as HTMLElement | null;
    const currentContainer = e.currentTarget as HTMLElement;
    if (!related || !currentContainer.contains(related)) {
      if (dragOverSekbidId === targetSekbidId) {
        setDragOverSekbidId(null);
      }
    }
  };

  const executeMoveMember = (member: SekbidMember, targetSekbidId: number) => {
    if (member.sekbidId === targetSekbidId) return;

    const targetSekbid = sekbidList.find((s) => s.id === targetSekbidId);
    const targetMembers = members.filter((m) => m.sekbidId === targetSekbidId);

    // If member was Ketua/Wakil and target already has one, default to 'Anggota'
    let newRole: SekbidRole = member.role;
    if (member.role === 'Ketua Sekbid') {
      const hasKetua = targetMembers.some((m) => m.role === 'Ketua Sekbid' && m.id !== member.id);
      if (hasKetua) newRole = 'Anggota';
    } else if (member.role === 'Wakil Ketua Sekbid') {
      const hasWakil = targetMembers.some((m) => m.role === 'Wakil Ketua Sekbid' && m.id !== member.id);
      if (hasWakil) newRole = 'Anggota';
    }

    const prevSekbidId = member.sekbidId;
    const prevRole = member.role;

    onUpdateMember(member.id, {
      sekbidId: targetSekbidId,
      role: newRole,
    });

    const toastId = `toast-${Date.now()}`;
    const targetName = targetSekbid ? `${targetSekbid.code} (${targetSekbid.shortTitle})` : `Sekbid ${targetSekbidId}`;
    setToastMessage({
      id: toastId,
      text: `${member.name} berhasil dipindahkan ke ${targetName}`,
      memberId: member.id,
      prevSekbidId,
      prevRole,
    });

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === toastId ? null : prev));
    }, 6000);
  };

  const handleDrop = (e: React.DragEvent, targetSekbidId: number) => {
    e.preventDefault();
    setDragOverSekbidId(null);

    let member = draggedMember;
    if (!member) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) member = JSON.parse(raw);
      } catch (err) {
        console.error(err);
      }
    }

    if (member) {
      executeMoveMember(member, targetSekbidId);
    }
    setDraggedMember(null);
  };

  const handleDragEnd = () => {
    setDraggedMember(null);
    setDragOverSekbidId(null);
  };

  const handleUndoMove = () => {
    if (!toastMessage) return;
    onUpdateMember(toastMessage.memberId, {
      sekbidId: toastMessage.prevSekbidId,
      role: toastMessage.prevRole,
    });
    setToastMessage(null);
  };

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
    if (!editingSekbid || !updateSekbidDetail) return;
    const prokerArray = sekbidProkers
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    updateSekbidDetail(editingSekbid.id, {
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
      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Struktur 10 Seksi Bidang OSIS
              </span>
              <span className="text-xs text-slate-300 font-semibold">Periode {config.period}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">
              Daftar Pengurus 10 Sekbid OSIS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola struktur kepengurusan 10 Seksi Bidang (Sekbid) OSIS secara lengkap: Ketua, Wakil Ketua, dan Anggota aktif dengan program kerja terintegrasi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-start md:justify-end md:ml-auto gap-2.5 shrink-0 pt-2 md:pt-0">
            {onSyncSheets && (
              <button
                id="btn-sync-sekbid"
                onClick={onSyncSheets}
                disabled={isSyncing}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                title="Sinkronkan Data Sekbid ke Google Sheets"
              >
                <UploadCloud className={`w-4 h-4 mr-1.5 text-emerald-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                {isSyncing ? 'Menyimpan...' : 'Sinkron'}
              </button>
            )}

            <button
              id="btn-export-csv-sekbid"
              onClick={handleExportCSV}
              className="inline-flex items-center px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-bold transition-all"
              title="Unduh Data CSV"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-300" />
              Export CSV
            </button>

            <button
              id="btn-print-sekbid"
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-bold transition-all"
              title="Cetak Struktur"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-300" />
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
                className="inline-flex items-center px-3.5 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold transition-all"
                title="Reset ke Standar 10 Sekbid"
              >
                <RotateCcw className="w-4 h-4 mr-1.5 text-amber-400" />
                Reset Standar
              </button>
            )}

            <button
              id="btn-add-sekbid-member-top"
              onClick={() => handleOpenAddMember()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Tambah Anggota
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid (Soft Pastel UI with White Floating Circle Icons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-indigo-50/70 border border-indigo-100/90 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-900/60 uppercase tracking-wider">Total Seksi Bidang</span>
              <p className="text-xl font-black text-slate-900 tracking-tight mt-1">10 Sekbid</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600 border border-indigo-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xs text-slate-500 font-medium block mt-2">Struktur OSIS Lengkap</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-100/90 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-900/60 uppercase tracking-wider">Ketua Sekbid</span>
              <p className="text-xl font-black text-amber-900 tracking-tight mt-1">{totalKetua} / 10</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-amber-600 border border-amber-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xs text-amber-700 font-medium block mt-2">Koordinator Utama</span>
        </div>

        <div className="bg-sky-50/70 border border-sky-100/90 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-sky-900/60 uppercase tracking-wider">Wakil Ketua Sekbid</span>
              <p className="text-xl font-black text-sky-900 tracking-tight mt-1">{totalWakil} / 10</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-sky-600 border border-sky-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xs text-sky-700 font-medium block mt-2">Pendamping Sekbid</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100/90 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-900/60 uppercase tracking-wider">Total Anggota Sekbid</span>
              <p className="text-xl font-black text-emerald-900 tracking-tight mt-1">{members.length} Orang</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-emerald-600 border border-emerald-100/60 shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xs text-emerald-700 font-medium block mt-2">Staf & Anggota Aktif</span>
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
        /* 10 SEKBID FULL OVERVIEW GRID WITH DRAG & DROP */
        <div className="space-y-6">
          {/* Drag & Drop Guide Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-blue-50 border border-indigo-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Fitur Interaktif Drag & Drop Antar Sekbid Aktif!
                </p>
                <p className="text-[11px] text-slate-600">
                  Tarik kartu pengurus (Ketua, Wakil, atau Anggota) dan lepaskan pada kotak Sekbid lain untuk memindahkan divisi secara instan, atau klik ikon transfer <ArrowRightLeft className="w-3 h-3 inline text-indigo-600" /> untuk pindah cepat.
                </p>
              </div>
            </div>
            {draggedMember && (
              <div className="flex items-center space-x-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs animate-pulse shrink-0">
                <GripVertical className="w-3.5 h-3.5" />
                <span>Memindahkan: {draggedMember.name}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sekbidList.map((sekbid) => {
              const sekbidMembers = members.filter((m) => m.sekbidId === sekbid.id);
              const ketua = sekbidMembers.find((m) => m.role === 'Ketua Sekbid');
              const wakil = sekbidMembers.find((m) => m.role === 'Wakil Ketua Sekbid');
              const anggotaList = sekbidMembers.filter((m) => m.role === 'Anggota');
              const style = THEME_STYLES[sekbid.themeColor] || THEME_STYLES.indigo;
              const IconComp = ICONS_MAP[sekbid.iconName] || Users;
              const isOverTarget = dragOverSekbidId === sekbid.id && draggedMember?.sekbidId !== sekbid.id;

              return (
                <div
                  key={sekbid.id}
                  id={`sekbid-card-${sekbid.id}`}
                  onDragOver={(e) => handleDragOver(e, sekbid.id)}
                  onDragLeave={(e) => handleDragLeave(e, sekbid.id)}
                  onDrop={(e) => handleDrop(e, sekbid.id)}
                  className={`bg-white rounded-xl shadow-xs border overflow-hidden flex flex-col transition-all relative ${
                    isOverTarget
                      ? 'ring-2 ring-indigo-500 ring-offset-2 border-indigo-400 bg-indigo-50/50 scale-[1.01] shadow-lg'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  {/* Drop Overlay when dragged over */}
                  {isOverTarget && (
                    <div className="absolute inset-0 bg-indigo-600/90 backdrop-blur-2xs z-30 flex flex-col items-center justify-center p-4 text-white text-center animate-fade-in pointer-events-none">
                      <div className="p-3 bg-white/20 rounded-full mb-2 animate-bounce">
                        <ArrowRightLeft className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-bold">Lepaskan di sini untuk memindahkan</p>
                      <p className="text-xs text-indigo-100 font-medium mt-0.5">
                        <strong>{draggedMember?.name}</strong> ➔ <strong>{sekbid.code}: {sekbid.shortTitle}</strong>
                      </p>
                    </div>
                  )}

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
                      <div
                        draggable={!!ketua}
                        onDragStart={(e) => ketua && handleDragStart(e, ketua)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-lg border border-amber-200 bg-amber-50/50 relative group transition-all ${
                          ketua ? 'cursor-grab active:cursor-grabbing hover:shadow-xs' : ''
                        } ${
                          draggedMember?.id === ketua?.id
                            ? 'opacity-40 border-dashed border-amber-500 scale-[0.98]'
                            : ''
                        }`}
                        title={ketua ? "Tarik untuk memindahkan ke Sekbid lain" : undefined}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            <Crown className="w-3 h-3 mr-1 text-amber-600" />
                            Ketua Sekbid
                          </span>
                          {ketua && (
                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => setQuickMoveMember(ketua)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                                title="Pindahkan ke Sekbid lain"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                              </button>
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
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-slate-900">{ketua.name}</h4>
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500" />
                            </div>
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
                      <div
                        draggable={!!wakil}
                        onDragStart={(e) => wakil && handleDragStart(e, wakil)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 relative group transition-all ${
                          wakil ? 'cursor-grab active:cursor-grabbing hover:shadow-xs' : ''
                        } ${
                          draggedMember?.id === wakil?.id
                            ? 'opacity-40 border-dashed border-indigo-500 scale-[0.98]'
                            : ''
                        }`}
                        title={wakil ? "Tarik untuk memindahkan ke Sekbid lain" : undefined}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                            <UserCheck className="w-3 h-3 mr-1 text-indigo-600" />
                            Wakil Ketua
                          </span>
                          {wakil && (
                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => setQuickMoveMember(wakil)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                                title="Pindahkan ke Sekbid lain"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                              </button>
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
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-slate-900">{wakil.name}</h4>
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                            </div>
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
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {anggotaList.map((m) => (
                            <div
                              key={m.id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, m)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all cursor-grab active:cursor-grabbing group ${
                                draggedMember?.id === m.id
                                  ? 'opacity-40 border-dashed border-indigo-500 bg-indigo-50 scale-[0.98]'
                                  : ''
                              }`}
                              title="Tarik & lepas untuk memindahkan ke Sekbid lain"
                            >
                              <div className="flex items-center space-x-2">
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 shrink-0" />
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
                                <button
                                  onClick={() => setQuickMoveMember(m)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                  title="Pindahkan ke Sekbid lain"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                </button>
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
                                id={`btn-move-member-${m.id}`}
                                onClick={() => setQuickMoveMember(m)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                title="Pindahkan Pengurus ke Sekbid Lain"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
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
              {/* 1. Seksi Bidang (Sekbid Bidang) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Seksi Bidang (Sekbid) *
                </label>
                <select
                  id="select-sekbid-field"
                  value={formSekbidId}
                  onChange={(e) => setFormSekbidId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium shadow-2xs"
                >
                  {sekbidList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.title}
                    </option>
                  ))}
                </select>
                <p className="text-2xs text-slate-400 mt-1">Pilih bidang dari 10 Seksi Bidang OSIS</p>
              </div>

              {/* 2. Jabatan Sekbid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Jabatan Sekbid *
                </label>
                <select
                  id="select-sekbid-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as SekbidRole)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold text-slate-800 shadow-2xs"
                >
                  <option value="Ketua Sekbid">👑 Ketua Sekbid (Koordinator)</option>
                  <option value="Wakil Ketua Sekbid">🤝 Wakil Ketua Sekbid</option>
                  <option value="Anggota">👤 Anggota Sekbid</option>
                </select>
              </div>

              {/* 3. Nama Siswa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Siswa / Pengurus *
                </label>
                <input
                  id="input-sekbid-member-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masukkan nama lengkap siswa..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              {/* Opsional Tambahan (Collapsible) */}
              <details className="group border border-slate-200 rounded-xl overflow-hidden">
                <summary className="px-4 py-2.5 bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center justify-between transition-colors">
                  <span>Data Tambahan (Kelas / NISN / Tugas) - Opsional</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-4 space-y-3 bg-white border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                        Kelas / Tingkat
                      </label>
                      <input
                        type="text"
                        value={formGradeClass}
                        onChange={(e) => setFormGradeClass(e.target.value)}
                        placeholder="Contoh: XI MIPA 1"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                        NIS / NISN
                      </label>
                      <input
                        type="text"
                        value={formNis}
                        onChange={(e) => setFormNis(e.target.value)}
                        placeholder="Contoh: 1023401"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                      Tugas Khusus / Tanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={formTask}
                      onChange={(e) => setFormTask(e.target.value)}
                      placeholder="Contoh: Sie Acara / Koordinator Lomba"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                      Status Keaktifan
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
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
                      <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
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
                </div>
              </details>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  id="btn-cancel-sekbid-member"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-sekbid-member"
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

      {/* ================= MODAL QUICK MOVE SEKBID ================= */}
      {quickMoveMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Pindahkan Pengurus Sekbid</h3>
                  <p className="text-xs text-indigo-100">
                    Pilih Seksi Bidang tujuan untuk <strong>{quickMoveMember.name}</strong> ({quickMoveMember.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickMoveMember(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-slate-500 font-medium mb-3">
                Pilih salah satu dari 10 Sekbid tujuan di bawah ini:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {sekbidList.map((targetSekbid) => {
                  const isCurrent = targetSekbid.id === quickMoveMember.sekbidId;
                  const IconComp = ICONS_MAP[targetSekbid.iconName] || Users;
                  const style = THEME_STYLES[targetSekbid.themeColor] || THEME_STYLES.indigo;
                  const currentMemberCount = members.filter((m) => m.sekbidId === targetSekbid.id).length;

                  return (
                    <button
                      key={targetSekbid.id}
                      disabled={isCurrent}
                      onClick={() => {
                        executeMoveMember(quickMoveMember, targetSekbid.id);
                        setQuickMoveMember(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 ${
                        isCurrent
                          ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-xs hover:bg-indigo-50/40'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isCurrent ? 'bg-slate-200 text-slate-500' : `${style.badgeBg} ${style.badgeText}`}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {targetSekbid.code}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                              Saat Ini
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {targetSekbid.shortTitle}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {currentMemberCount} Pengurus terdaftar
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setQuickMoveMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING TOAST WITH UNDO ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 max-w-md">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-xs flex-1">
              <p className="font-medium text-slate-100">{toastMessage.text}</p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleUndoMove}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Urungkan
              </button>
              <button
                onClick={() => setToastMessage(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
