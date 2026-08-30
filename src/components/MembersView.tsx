import React, { useState, useRef, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Coins, 
  CalendarCheck, 
  X,
  MessageSquareShare,
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  School,
  GraduationCap,
  Sparkles,
  FileCheck,
  AlertTriangle,
  UserX,
  CheckSquare,
  Square,
  Layers,
  Eraser
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Member, 
  Division, 
  Role, 
  AttendanceRecord, 
  MonthlyDuesRecord, 
  OrganizationConfig, 
  AttendanceEvent 
} from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface MembersViewProps {
  members: Member[];
  records: AttendanceRecord[];
  duesRecords: MonthlyDuesRecord[];
  events: AttendanceEvent[];
  config: OrganizationConfig;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onBulkAddMembers?: (members: Omit<Member, 'id'>[]) => void;
  onBulkDeleteMembers?: (ids: string[], title?: string) => void;
  onUpdateMember: (id: string, updated: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
}

const DIVISIONS: Division[] = [
  'Badan Pengurus Harian (BPH)',
  'Sekbid 1 (Keimanan & Ketakwaan)',
  'Sekbid 2 (Budi Pekerti & Akhlak Mulia)',
  'Sekbid 3 (Bela Negara & Wawasan Kebangsaan)',
  'Sekbid 4 (Akademik, Seni & Olahraga)',
  'Sekbid 5 (Demokrasi & Lingkungan Hidup)',
  'Sekbid 6 (Kreativitas & Kewirausahaan)',
  'Sekbid 7 (Kesehatan Jasmani & Gizi)',
  'Sekbid 8 (Sastra & Budaya)',
  'Sekbid 9 (TIK & Publikasi Media)',
  'Sekbid 10 (Komunikasi Bahasa Asing)',
];

const ROLES: Role[] = [
  'Ketua Umum',
  'Wakil Ketua',
  'Sekretaris 1',
  'Sekretaris 2',
  'Bendahara 1',
  'Bendahara 2',
  'Koordinator Divisi',
  'Staf Ahli',
  'Anggota Aktif',
];

interface ParsedImportMember {
  name: string;
  kelas: string;
  phone: string;
  nim: string;
  division: Division;
  role: Role;
  email: string;
  isValid: boolean;
  errorMessage?: string;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members = [],
  records = [],
  duesRecords = [],
  events = [],
  config,
  onAddMember,
  onBulkAddMembers,
  onBulkDeleteMembers,
  onUpdateMember,
  onDeleteMember,
}) => {
  const safeMembers = Array.isArray(members) ? members : [];
  const safeRecords = Array.isArray(records) ? records : [];
  const safeDuesRecords = Array.isArray(duesRecords) ? duesRecords : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTab, setDeleteTab] = useState<'class' | 'name' | 'cleanup'>('class');
  
  // Selected IDs for batch deletion
  const [selectedIdsForDelete, setSelectedIdsForDelete] = useState<string[]>([]);
  const [selectedClassesForDelete, setSelectedClassesForDelete] = useState<string[]>([]);
  const [nameSearchInDeleteModal, setNameSearchInDeleteModal] = useState('');

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);

  // Form State
  const [nim, setNim] = useState('');
  const [name, setName] = useState('');
  const [kelas, setKelas] = useState('');
  const [division, setDivision] = useState<Division>('Sekbid 1 (Keimanan & Ketakwaan)');
  const [role, setRole] = useState<Role>('Anggota Aktif');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Import Excel State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedImportMember[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Detect corrupted or header row members (e.g. "Nomor WhatsApp (Terpisah)" or contains "nomor whatsapp")
  const corruptedMembers = useMemo(() => {
    return members.filter(m => {
      const lowerName = (m.name || '').toLowerCase();
      const lowerNim = (m.nim || '').toLowerCase();
      return (
        lowerName.includes('nomor whatsapp') ||
        lowerName.includes('terpisah') ||
        lowerName.includes('no. whatsapp') ||
        lowerName.includes('nisn / nim') ||
        lowerName.includes('nama lengkap') ||
        lowerName.includes('nama siswa') ||
        lowerNim.includes('nomor') ||
        lowerNim.includes('nisn')
      );
    });
  }, [members]);

  // Distinct classes list with count
  const classStats = useMemo(() => {
    const map = new Map<string, number>();
    members.forEach(m => {
      const k = m.kelas?.trim() || 'Tanpa Kelas';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([className, count]) => ({
      className,
      count,
    })).sort((a, b) => a.className.localeCompare(b.className));
  }, [members]);

  const openAddModal = () => {
    setEditingMember(null);
    setNim('');
    setName('');
    setKelas('');
    setDivision('Sekbid 1 (Keimanan & Ketakwaan)');
    setRole('Anggota Aktif');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setNim(member.nim);
    setName(member.name);
    setKelas(member.kelas || '');
    setDivision(member.division);
    setRole(member.role);
    setPhone(member.phone);
    setEmail(member.email);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nim.trim()) return;

    if (editingMember) {
      onUpdateMember(editingMember.id, {
        name: name.trim(),
        nim: nim.trim(),
        kelas: kelas.trim(),
        division,
        role,
        phone: phone.trim(),
        email: email.trim(),
      });
    } else {
      onAddMember({
        name: name.trim(),
        nim: nim.trim(),
        kelas: kelas.trim() || 'X',
        division,
        role,
        phone: phone.trim() || '081200000000',
        email: email.trim() || `${nim.trim()}@student.sch.id`,
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true,
      });
    }

    setIsModalOpen(false);
  };

  // ==========================================
  // BULK DELETE HANDLERS
  // ==========================================
  const handleOpenDeleteModal = () => {
    setSelectedIdsForDelete([]);
    setSelectedClassesForDelete([]);
    setNameSearchInDeleteModal('');
    setDeleteTab('class');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteByClasses = () => {
    if (selectedClassesForDelete.length === 0) return;
    const targetIds = members
      .filter(m => selectedClassesForDelete.includes(m.kelas?.trim() || 'Tanpa Kelas'))
      .map(m => m.id);

    if (targetIds.length === 0) return;

    if (confirm(`Hapus seluruh ${targetIds.length} siswa dari kelas: ${selectedClassesForDelete.join(', ')}?`)) {
      if (onBulkDeleteMembers) {
        onBulkDeleteMembers(targetIds, `Hapus Kelas ${selectedClassesForDelete.join(', ')}`);
      } else {
        targetIds.forEach(id => onDeleteMember(id));
      }
      setSelectedClassesForDelete([]);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteSelectedNames = () => {
    if (selectedIdsForDelete.length === 0) return;

    if (confirm(`Hapus ${selectedIdsForDelete.length} siswa yang telah dipilih?`)) {
      if (onBulkDeleteMembers) {
        onBulkDeleteMembers(selectedIdsForDelete, 'Hapus Anggota Terpilih');
      } else {
        selectedIdsForDelete.forEach(id => onDeleteMember(id));
      }
      setSelectedIdsForDelete([]);
      setIsDeleteModalOpen(false);
    }
  };

  const handleCleanCorruptedMembers = () => {
    if (corruptedMembers.length === 0) return;
    const ids = corruptedMembers.map(m => m.id);
    if (confirm(`Hapus ${ids.length} baris sampah / header yang terdeteksi?`)) {
      if (onBulkDeleteMembers) {
        onBulkDeleteMembers(ids, 'Pembersihan Baris Sampah');
      } else {
        ids.forEach(id => onDeleteMember(id));
      }
    }
  };

  // ==========================================
  // EXCEL IMPORT HANDLERS
  // ==========================================
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Ahmad Fauzi',
        'Kelas': 'XI MIPA 1',
        'Nomor WhatsApp': '081234567891',
        'NISN / NIM': '2311501001',
        'Sekbid': 'Sekbid 1 (Keimanan & Ketakwaan)',
        'Jabatan': 'Koordinator Divisi',
        'Email': 'ahmad.fauzi@sekolah.sch.id'
      },
      {
        'Nama Lengkap': 'Siti Nurhaliza',
        'Kelas': 'XI IPS 2',
        'Nomor WhatsApp': '085712345678',
        'NISN / NIM': '2311501002',
        'Sekbid': 'Sekbid 3 (Bela Negara & Wawasan Kebangsaan)',
        'Jabatan': 'Anggota Aktif',
        'Email': 'siti.nur@sekolah.sch.id'
      },
      {
        'Nama Lengkap': 'Rizky Pratama',
        'Kelas': 'X MIPA 3',
        'Nomor WhatsApp': '087899887766',
        'NISN / NIM': '2311501003',
        'Sekbid': 'Sekbid 9 (TIK & Publikasi Media)',
        'Jabatan': 'Staf Ahli',
        'Email': 'rizky.pratama@sekolah.sch.id'
      },
      {
        'Nama Lengkap': 'Dewi Lestari',
        'Kelas': 'XII MIPA 2',
        'Nomor WhatsApp': '082155667788',
        'NISN / NIM': '2311501004',
        'Sekbid': 'Badan Pengurus Harian (BPH)',
        'Jabatan': 'Sekretaris 1',
        'Email': 'dewi.lestari@sekolah.sch.id'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 24 }, // Nama
      { wch: 14 }, // Kelas
      { wch: 18 }, // WhatsApp
      { wch: 16 }, // NISN
      { wch: 28 }, // Sekbid
      { wch: 20 }, // Jabatan
      { wch: 26 }  // Email
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Anggota');
    XLSX.writeFile(wb, 'Template_Data_Anggota_OSIS.xlsx');
  };

  const processFile = (file: File) => {
    setImportError(null);
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setImportError('File Excel tidak memiliki lembar kerja (worksheet).');
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows || rows.length === 0) {
          setImportError('File Excel kosong atau tidak memiliki baris data.');
          return;
        }

        const parsed: ParsedImportMember[] = [];

        rows.forEach((row, index) => {
          // Normalize object keys to lowercase trimmed
          const normalized: Record<string, string> = {};
          Object.keys(row).forEach((k) => {
            normalized[k.trim().toLowerCase()] = String(row[k]).trim();
          });

          // Helper to find value from possible key synonyms
          const findKey = (keys: string[]) => {
            for (const key of keys) {
              if (normalized[key]) return normalized[key];
            }
            return '';
          };

          const rawName = findKey(['nama lengkap', 'nama siswa', 'nama', 'name', 'full name', 'nama_lengkap', 'nama anggota']);
          const rawKelas = findKey(['kelas', 'kelas siswa', 'tingkat', 'rombel', 'class', 'jurusan', 'grade']);
          const rawPhone = findKey(['nomor whatsapp', 'no. whatsapp', 'no whatsapp', 'whatsapp', 'no wa', 'wa', 'telepon', 'nomor telepon', 'no hp', 'phone', 'hp', 'handphone']);
          const rawNim = findKey(['nisn / nim', 'nisn', 'nim', 'nis', 'nomor induk', 'no. induk', 'no induk', 'id anggota']);
          const rawDivision = findKey(['divisi', 'sekbid', 'seksi bidang', 'bidang', 'division', 'departemen']);
          const rawRole = findKey(['jabatan', 'role', 'posisi', 'status jabatan']);
          const rawEmail = findKey(['email', 'surel', 'e-mail', 'alamat email']);

          const lowerName = (rawName || '').toLowerCase();
          
          // Skip header row if imported as data
          if (
            lowerName.includes('nomor whatsapp') || 
            lowerName.includes('terpisah') || 
            lowerName.includes('nama lengkap') ||
            lowerName.includes('nisn / nim')
          ) {
            return;
          }

          const isValid = Boolean(rawName && rawName.length >= 2);
          const errorMessage = !rawName ? 'Nama siswa tidak boleh kosong' : undefined;

          // Match closest division or default
          let finalDivision: Division = 'Sekbid 1 (Keimanan & Ketakwaan)';
          if (rawDivision) {
            const matched = DIVISIONS.find(d => 
              d.toLowerCase().includes(rawDivision.toLowerCase()) || 
              rawDivision.toLowerCase().includes(d.toLowerCase())
            );
            if (matched) finalDivision = matched;
          }

          // Match closest role or default
          let finalRole: Role = 'Anggota Aktif';
          if (rawRole) {
            const matchedRole = ROLES.find(r => 
              r.toLowerCase().includes(rawRole.toLowerCase()) ||
              rawRole.toLowerCase().includes(r.toLowerCase())
            );
            if (matchedRole) finalRole = matchedRole;
          }

          // Format phone number
          let cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
          if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.slice(2);
          if (cleanPhone.startsWith('+62')) cleanPhone = '0' + cleanPhone.slice(3);
          if (!cleanPhone) cleanPhone = '081200000000';

          const finalNim = rawNim || `${2311000 + index + 1}`;
          const finalKelas = rawKelas || 'X';
          const finalEmail = rawEmail || `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'siswa'}@student.sch.id`;

          parsed.push({
            name: rawName || `Siswa ${index + 1}`,
            kelas: finalKelas,
            phone: cleanPhone,
            nim: finalNim,
            division: finalDivision,
            role: finalRole,
            email: finalEmail,
            isValid,
            errorMessage,
          });
        });

        setParsedData(parsed);
      } catch (err: any) {
        console.error(err);
        setImportError(`Gagal membaca file: ${err?.message || 'Format tidak didukung'}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    const validRows = parsedData.filter(d => d.isValid);
    if (validRows.length === 0) {
      setImportError('Tidak ada data anggota valid yang dapat diimpor.');
      return;
    }

    const newMembersPayload: Omit<Member, 'id'>[] = validRows.map(row => ({
      name: row.name,
      kelas: row.kelas,
      phone: row.phone,
      nim: row.nim,
      division: row.division,
      role: row.role,
      email: row.email,
      joinDate: new Date().toISOString().split('T')[0],
      isActive: true,
    }));

    if (onBulkAddMembers) {
      onBulkAddMembers(newMembersPayload);
    } else {
      newMembersPayload.forEach(m => onAddMember(m));
    }

    setIsImportModalOpen(false);
    setParsedData([]);
    setImportFileName(null);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nim.includes(searchQuery) ||
      (m.kelas && m.kelas.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.phone.includes(searchQuery) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivision = divisionFilter === 'all' || m.division === divisionFilter;
    return matchesSearch && matchesDivision;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                {members.length} Anggota Pengurus Terdaftar
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">
              Direktori Pengurus & Anggota OSIS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Daftar lengkap nama siswa, kelas, nomor WhatsApp, riwayat presensi, dan status iuran kas organisasi terpadu.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 shrink-0 pt-2 md:pt-0">
            {/* Hapus Anggota Button */}
            <button
              type="button"
              id="btn-open-delete-members"
              onClick={handleOpenDeleteModal}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <UserX className="w-4 h-4 text-rose-400" />
              <span>Hapus Anggota</span>
            </button>

            {/* Import Excel Button */}
            <button
              type="button"
              id="btn-open-import-excel"
              onClick={() => {
                setParsedData([]);
                setImportFileName(null);
                setImportError(null);
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>

            {/* Add Member Button */}
            <button
              type="button"
              id="btn-open-add-member"
              onClick={openAddModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>
      </div>

      {/* Corrupted Items Clean Banner (if detected) */}
      {corruptedMembers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Terdeteksi {corruptedMembers.length} Baris Header / Data Sampah
              </h4>
              <p className="text-2xs text-amber-800 mt-0.5">
                Contoh: <span className="font-mono font-semibold">{corruptedMembers[0].name}</span>. Anda dapat menghapusnya secara otomatis sekarang.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCleanCorruptedMembers}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Hapus Baris Sampah ({corruptedMembers.length})</span>
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-members"
            placeholder="Cari berdasarkan Nama Siswa, Kelas, No. WhatsApp, atau NISN/NIM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="select-division-filter"
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Sekbid ({members.length})</option>
            {DIVISIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Anggota yang Sesuai</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery ? `Tidak ditemukan data anggota dengan kata kunci "${searchQuery}".` : 'Belum ada anggota terdaftar. Anda dapat menambahkan anggota secara manual atau mengimpor file Excel.'}
          </p>
          <div className="pt-2 flex justify-center space-x-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200 inline-flex items-center space-x-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import File Excel</span>
            </button>
            <button
              onClick={openAddModal}
              className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-xl inline-flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const memberRecords = records.filter(r => r.memberId === member.id);
            const hadirCount = memberRecords.filter(r => r.status === 'hadir').length;
            const attendanceRate = events.length > 0 ? Math.round((hadirCount / events.length) * 100) : 0;

            const paidDues = duesRecords.filter(d => d.memberId === member.id && d.status === 'lunas');
            const totalPaidAmount = paidDues.length * config.defaultMonthlyDue;

            const cleanPhone = member.phone.replace(/^0/, '62').replace(/[^0-9]/g, '');

            return (
              <div 
                key={member.id} 
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{member.name}</h3>
                          {member.kelas && (
                            <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              {member.kelas}
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-slate-500 font-mono mt-0.5">NISN/NIM: {member.nim}</p>
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-2xs mt-1 border border-indigo-100">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Edit Anggota"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus ${member.name} dari organisasi?`)) {
                            onDeleteMember(member.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Anggota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="font-medium text-slate-800 truncate">{member.division}</span>
                      {member.kelas && (
                        <span className="text-slate-500 font-medium">Kelas: <strong className="text-slate-800">{member.kelas}</strong></span>
                      )}
                    </div>
                    <p className="flex items-center text-slate-600 text-2xs font-mono">
                      <Phone className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                      <span>{member.phone || '-'}</span>
                    </p>
                  </div>

                  {/* Micro Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-2xs font-semibold text-slate-500 uppercase">Presensi</span>
                      <p className="text-xs font-bold text-indigo-700 font-mono mt-0.5">
                        {attendanceRate}% ({hadirCount}/{events.length})
                      </p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      <span className="text-2xs font-semibold text-emerald-700 uppercase">Iuran Kas</span>
                      <p className="text-xs font-bold text-emerald-800 font-mono mt-0.5">
                        {formatRupiah(totalPaidAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedMemberDetail(member)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Detail Rekam Jejak
                  </button>

                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg flex items-center space-x-1 transition-colors border border-emerald-200 shadow-2xs"
                  >
                    <MessageSquareShare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================
          MODAL HAPUS ANGGOTA (BERDASARKAN KELAS / NAMA)
          ========================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserX className="w-5 h-5" />
                <div>
                  <h2 className="text-base font-bold">Hapus Anggota</h2>
                  <p className="text-2xs text-rose-100">Hapus anggota berdasarkan kelas atau pilih nama tertentu</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDeleteTab('class')}
                className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-colors ${
                  deleteTab === 'class' 
                    ? 'border-rose-600 text-rose-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Berdasarkan Kelas ({classStats.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteTab('name')}
                className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-colors ${
                  deleteTab === 'name' 
                    ? 'border-rose-600 text-rose-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Pilih Berdasarkan Nama</span>
              </button>

              {corruptedMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeleteTab('cleanup')}
                  className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-colors ${
                    deleteTab === 'cleanup' 
                      ? 'border-rose-600 text-rose-600' 
                      : 'border-transparent text-amber-600 hover:text-amber-800'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Bersihkan Header ({corruptedMembers.length})</span>
                </button>
              )}
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs">
              
              {/* TAB 1: DELETE BY CLASS */}
              {deleteTab === 'class' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-600 text-xs">
                      Pilih satu atau beberapa kelas yang ingin dihapus seluruh siswanya:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedClassesForDelete.length === classStats.length) {
                          setSelectedClassesForDelete([]);
                        } else {
                          setSelectedClassesForDelete(classStats.map(c => c.className));
                        }
                      }}
                      className="text-2xs font-bold text-indigo-600 hover:underline"
                    >
                      {selectedClassesForDelete.length === classStats.length ? 'Batalkan Semua' : 'Pilih Semua Kelas'}
                    </button>
                  </div>

                  {classStats.length === 0 ? (
                    <p className="text-center text-slate-400 py-6">Tidak ada data kelas.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {classStats.map((item) => {
                        const isSelected = selectedClassesForDelete.includes(item.className);
                        return (
                          <div
                            key={item.className}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedClassesForDelete(prev => prev.filter(c => c !== item.className));
                              } else {
                                setSelectedClassesForDelete(prev => [...prev, item.className]);
                              }
                            }}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                              isSelected 
                                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className="font-bold text-xs truncate">{item.className}</span>
                            </div>
                            <span className="text-2xs font-extrabold px-2 py-0.5 bg-white border border-slate-200 rounded-md shrink-0">
                              {item.count} Siswa
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedClassesForDelete.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
                      <span>
                        Total siswa yang akan dihapus: <strong>{members.filter(m => selectedClassesForDelete.includes(m.kelas?.trim() || 'Tanpa Kelas')).length} Siswa</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DELETE BY NAME */}
              {deleteTab === 'name' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama siswa atau kelas..."
                      value={nameSearchInDeleteModal}
                      onChange={(e) => setNameSearchInDeleteModal(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between text-2xs text-slate-500">
                    <span>
                      {selectedIdsForDelete.length} siswa dipilih dari total {members.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedIdsForDelete.length === members.length) {
                          setSelectedIdsForDelete([]);
                        } else {
                          setSelectedIdsForDelete(members.map(m => m.id));
                        }
                      }}
                      className="font-bold text-indigo-600 hover:underline"
                    >
                      {selectedIdsForDelete.length === members.length ? 'Batalkan Pilihan' : 'Pilih Semua'}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white">
                    {members
                      .filter(m => 
                        m.name.toLowerCase().includes(nameSearchInDeleteModal.toLowerCase()) ||
                        (m.kelas && m.kelas.toLowerCase().includes(nameSearchInDeleteModal.toLowerCase()))
                      )
                      .map((member) => {
                        const isChecked = selectedIdsForDelete.includes(member.id);
                        return (
                          <div
                            key={member.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedIdsForDelete(prev => prev.filter(id => id !== member.id));
                              } else {
                                setSelectedIdsForDelete(prev => [...prev, member.id]);
                              }
                            }}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked ? 'bg-rose-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <p className="font-bold text-slate-800 text-xs truncate">{member.name}</p>
                                <p className="text-2xs text-slate-500">
                                  Kelas: {member.kelas || '-'} • {member.role}
                                </p>
                              </div>
                            </div>
                            <span className="text-2xs font-mono text-slate-400 shrink-0">{member.nim}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 3: CLEANUP */}
              {deleteTab === 'cleanup' && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-xs">
                    Sistem mendeteksi {corruptedMembers.length} baris data yang berisi nama kolom header Excel (seperti "Nomor WhatsApp (Terpisah)").
                  </p>
                  <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 divide-y divide-amber-100">
                    {corruptedMembers.map((m) => (
                      <div key={m.id} className="py-1.5 flex items-center justify-between text-2xs">
                        <span className="font-bold text-amber-950 font-mono">{m.name}</span>
                        <span className="text-amber-700">ID: {m.nim}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl border border-slate-300"
              >
                Batal
              </button>

              {deleteTab === 'class' && (
                <button
                  type="button"
                  id="btn-confirm-delete-by-class"
                  disabled={selectedClassesForDelete.length === 0}
                  onClick={handleDeleteByClasses}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kelas Terpilih ({selectedClassesForDelete.length})</span>
                </button>
              )}

              {deleteTab === 'name' && (
                <button
                  type="button"
                  id="btn-confirm-delete-by-names"
                  disabled={selectedIdsForDelete.length === 0}
                  onClick={handleDeleteSelectedNames}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Siswa Terpilih ({selectedIdsForDelete.length})</span>
                </button>
              )}

              {deleteTab === 'cleanup' && (
                <button
                  type="button"
                  onClick={() => {
                    handleCleanCorruptedMembers();
                    setIsDeleteModalOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Bersihkan Semua ({corruptedMembers.length})</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL IMPORT EXCEL
          ========================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5" />
                <div>
                  <h2 className="text-base font-bold">Import Data Anggota dari Excel / CSV</h2>
                  <p className="text-2xs text-emerald-100">Mendukung file spreadsheet (.xlsx, .xls, .csv)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Action Banner: Download Template */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Format Kolom yang Dibutuhkan</span>
                  </h4>
                  <p className="text-2xs text-emerald-800 mt-0.5">
                    Kolom wajib: <strong>Nama Lengkap</strong>, <strong>Kelas</strong>, dan <strong>Nomor WhatsApp</strong> (opsional: NISN, Sekbid, Jabatan).
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-download-excel-template"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg shrink-0 flex items-center space-x-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unduh Template Excel</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-emerald-600 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  {importFileName ? importFileName : 'Klik atau Tarik File Excel ke Sini'}
                </p>
                <p className="text-2xs text-slate-500 mt-1">
                  Format yang didukung: .xlsx, .xls, .csv (Maks 10 MB)
                </p>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Table if Data Parsed */}
              {parsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-2xs flex items-center space-x-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Hasil Analisis Data ({parsedData.length} Baris)</span>
                    </span>
                    <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {parsedData.filter(d => d.isValid).length} Siap Diimpor
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl bg-white">
                    <table className="min-w-full divide-y divide-slate-200 text-2xs">
                      <thead className="bg-slate-50 font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Nama Siswa</th>
                          <th className="px-3 py-2 text-left">Kelas</th>
                          <th className="px-3 py-2 text-left">No. WhatsApp</th>
                          <th className="px-3 py-2 text-left">NISN / NIM</th>
                          <th className="px-3 py-2 text-left">Sekbid / Jabatan</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                            <td className="px-3 py-2 font-bold text-slate-900">{row.name}</td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold">
                                {row.kelas}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-700">{row.phone}</td>
                            <td className="px-3 py-2 font-mono text-slate-500">{row.nim}</td>
                            <td className="px-3 py-2 text-slate-600 truncate max-w-[140px]">{row.division} - {row.role}</td>
                            <td className="px-3 py-2 text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
                                  <span>Valid</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-rose-600 font-semibold" title={row.errorMessage}>
                                  <AlertCircle className="w-3.5 h-3.5 mr-0.5" />
                                  <span>Gagal</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-2xs text-slate-500">
                {parsedData.length > 0 ? `${parsedData.filter(d => d.isValid).length} dari ${parsedData.length} data valid` : 'Silakan pilih file Excel'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-confirm-import-excel"
                  disabled={parsedData.filter(d => d.isValid).length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Impor ke Database ({parsedData.filter(d => d.isValid).length})</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          ADD / EDIT MEMBER MODAL
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <h2 className="text-base font-bold">
                  {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  id="input-member-name"
                  required
                  placeholder="Contoh: Muhammad Farhan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas Siswa *
                  </label>
                  <input
                    type="text"
                    id="input-member-kelas"
                    placeholder="Contoh: X MIPA 1 / XI IPS 2"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN / NIM *
                  </label>
                  <input
                    type="text"
                    id="input-member-nim"
                    required
                    placeholder="Contoh: 2311501099"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sekbid Organisasi *
                  </label>
                  <select
                    id="select-member-division"
                    value={division}
                    onChange={(e) => setDivision(e.target.value as Division)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan *
                  </label>
                  <select
                    id="select-member-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp *
                  </label>
                  <input
                    type="text"
                    id="input-member-phone"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="input-member-email"
                    placeholder="nama@sekolah.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-member"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MEMBER DETAIL MODAL
          ========================================== */}
      {selectedMemberDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold">{selectedMemberDetail.name}</h2>
                  {selectedMemberDetail.kelas && (
                    <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-amber-400 text-slate-950">
                      {selectedMemberDetail.kelas}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono">{selectedMemberDetail.nim} • {selectedMemberDetail.division}</p>
              </div>
              <button onClick={() => setSelectedMemberDetail(null)} className="p-1 rounded hover:bg-white/20">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Profile Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kelas:</span>
                  <span className="font-bold text-slate-800">{selectedMemberDetail.kelas || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jabatan:</span>
                  <span className="font-bold text-slate-800">{selectedMemberDetail.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor WhatsApp:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedMemberDetail.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800">{selectedMemberDetail.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Bergabung:</span>
                  <span className="text-slate-800">{formatDateIndo(selectedMemberDetail.joinDate)}</span>
                </div>
              </div>

              {/* Attendance History */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-2">
                  Riwayat Presensi Kegiatan
                </h4>
                <div className="space-y-1.5 border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 bg-white">
                  {events.length === 0 ? (
                    <p className="text-center text-slate-400 py-3 text-2xs">Belum ada sesi presensi yang dibuat</p>
                  ) : (
                    events.map((evt) => {
                      const rec = records.find(r => r.eventId === evt.id && r.memberId === selectedMemberDetail.id);
                      return (
                        <div key={evt.id} className="py-1.5 px-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{evt.title}</p>
                            <p className="text-2xs text-slate-400">{formatDateIndo(evt.date)}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                            rec?.status === 'hadir' ? 'bg-emerald-100 text-emerald-800' : rec?.status === 'izin' ? 'bg-amber-100 text-amber-800' : rec?.status === 'sakit' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rec ? rec.status : 'Alpa / Belum'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Dues History */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-2">
                  Rekam Iuran Kas 2026
                </h4>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                    const rec = duesRecords.find(d => d.memberId === selectedMemberDetail.id && d.month === m);
                    const isLunas = rec?.status === 'lunas';
                    return (
                      <div 
                        key={m} 
                        className={`p-2 rounded-lg text-center border text-2xs font-bold ${
                          isLunas ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        <span className="block">{['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m - 1]}</span>
                        <span className="text-3xs">{isLunas ? 'Lunas' : 'Belum'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <a
                href={`https://wa.me/${selectedMemberDetail.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5"
              >
                <MessageSquareShare className="w-3.5 h-3.5" />
                <span>Kirim WhatsApp</span>
              </a>

              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
