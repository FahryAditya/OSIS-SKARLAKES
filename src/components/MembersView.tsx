import React, { useState } from 'react';
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
  MessageSquareShare
} from 'lucide-react';
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
  onUpdateMember: (id: string, updated: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
}

const DIVISIONS: Division[] = [
  'Badan Pengurus Harian (BPH)',
  'Divisi Acara & Program',
  'Divisi Humas & Eksternal',
  'Divisi Media & Kreatif',
  'Divisi Logistik & Perlengkapan',
  'Divisi Danus (Dana Usaha)',
  'Divisi Litbang & Keilmuan',
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

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  records,
  duesRecords,
  events,
  config,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);

  // Form State
  const [nim, setNim] = useState('');
  const [name, setName] = useState('');
  const [division, setDivision] = useState<Division>('Divisi Acara & Program');
  const [role, setRole] = useState<Role>('Anggota Aktif');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const openAddModal = () => {
    setEditingMember(null);
    setNim('');
    setName('');
    setDivision('Divisi Acara & Program');
    setRole('Anggota Aktif');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setNim(member.nim);
    setName(member.name);
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
        division,
        role,
        phone: phone.trim(),
        email: email.trim(),
      });
    } else {
      onAddMember({
        name: name.trim(),
        nim: nim.trim(),
        division,
        role,
        phone: phone.trim() || '081200000000',
        email: email.trim() || `${nim.trim()}@student.ac.id`,
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true,
      });
    }

    setIsModalOpen(false);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nim.includes(searchQuery) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivision = divisionFilter === 'all' || m.division === divisionFilter;
    return matchesSearch && matchesDivision;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Direktori Pengurus & Anggota</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {members.length} Anggota Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar profil pengurus, riwayat presensi individual, serta rekam status iuran kas organisasi.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Anggota Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NIM, atau jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Divisi ({members.length})</option>
            {DIVISIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const memberRecords = records.filter(r => r.memberId === member.id);
          const hadirCount = memberRecords.filter(r => r.status === 'hadir').length;
          const attendanceRate = events.length > 0 ? Math.round((hadirCount / events.length) * 100) : 0;

          const paidDues = duesRecords.filter(d => d.memberId === member.id && d.status === 'lunas');
          const totalPaidAmount = paidDues.length * config.defaultMonthlyDue;

          return (
            <div 
              key={member.id} 
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center shrink-0 border border-indigo-200">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{member.name}</h3>
                      <p className="text-2xs text-slate-500 font-mono mt-0.5">NIM: {member.nim}</p>
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-2xs mt-1">
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="font-medium text-slate-800 text-2xs truncate">{member.division}</p>
                  <p className="flex items-center text-slate-500 text-2xs">
                    <Phone className="w-3 h-3 mr-1 text-slate-400" />
                    {member.phone}
                  </p>
                </div>

                {/* Micro Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-2xs font-semibold text-slate-500 uppercase">Presensi</span>
                    <p className="text-xs font-bold text-indigo-700 font-mono mt-0.5">
                      {attendanceRate}% ({hadirCount}/{events.length})
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-xl">
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
                  href={`https://wa.me/${member.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg flex items-center space-x-1 transition-colors border border-emerald-200"
                >
                  <MessageSquareShare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">
                {editingMember ? 'Edit Data Pengurus' : 'Tambah Anggota Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIM / Nomor Induk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2311501099"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Divisi *</label>
                  <select
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan *</label>
                  <select
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="nama@student.ac.id"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL MODAL */}
      {selectedMemberDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">{selectedMemberDetail.name}</h2>
                <p className="text-xs text-slate-400 font-mono">{selectedMemberDetail.nim} • {selectedMemberDetail.division}</p>
              </div>
              <button onClick={() => setSelectedMemberDetail(null)} className="p-1 rounded hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Profile Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jabatan:</span>
                  <span className="font-bold text-slate-800">{selectedMemberDetail.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Telepon:</span>
                  <span className="font-mono text-slate-800">{selectedMemberDetail.phone}</span>
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
                  {events.map((evt) => {
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
                  })}
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

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
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
