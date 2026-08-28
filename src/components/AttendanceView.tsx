import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Plus, 
  QrCode, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Users, 
  FileSpreadsheet, 
  Printer, 
  Check, 
  X, 
  UserCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { 
  AttendanceEvent, 
  AttendanceRecord, 
  Member, 
  EventType, 
  AttendanceStatus, 
  Division, 
  OrganizationConfig 
} from '../types';
import { formatDateIndo, exportToCSV } from '../utils/formatters';

interface AttendanceViewProps {
  events: AttendanceEvent[];
  records: AttendanceRecord[];
  members: Member[];
  config: OrganizationConfig;
  onCreateEvent: (event: Omit<AttendanceEvent, 'id' | 'qrCodeToken'>) => void;
  onUpdateRecordStatus: (eventId: string, memberId: string, status: AttendanceStatus, notes?: string) => void;
  onOpenSelfCheckIn: () => void;
  onPrintReport: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  events = [],
  records = [],
  members = [],
  config,
  onCreateEvent,
  onUpdateRecordStatus,
  onOpenSelfCheckIn,
  onPrintReport,
}) => {
  const safeEvents = Array.isArray(events) ? events : [];
  const safeRecords = Array.isArray(records) ? records : [];
  const safeMembers = Array.isArray(members) ? members : [];

  const [selectedEventId, setSelectedEventId] = useState<string>(safeEvents[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'live' | 'recap'>('live');
  const [searchMember, setSearchMember] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Custom Modal State for Keterangan Izin / Sakit (replaces plain browser prompt)
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    member?: Member;
    eventId?: string;
    status?: 'izin' | 'sakit';
    reasonText: string;
  }>({
    isOpen: false,
    reasonText: '',
  });

  // Auto-sync selectedEventId when events list changes or initializes
  React.useEffect(() => {
    if (events.length > 0 && (!selectedEventId || !events.some(e => e.id === selectedEventId))) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('Rapat Pleno');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('13:30');
  const [newEndTime, setNewEndTime] = useState('16:00');
  const [newLocation, setNewLocation] = useState('Ruang Rapat Sekretariat');
  const [newLocationType, setNewLocationType] = useState<'offline' | 'online'>('offline');
  const [newDivisionTarget, setNewDivisionTarget] = useState<string>('Semua Divisi');
  const [newOrganizer, setNewOrganizer] = useState('BPH & Sekretariat');
  const [newNotes, setNewNotes] = useState('');

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const currentEventRecords = records.filter(r => r.eventId === currentEvent?.id);

  // Calculate statistics for selected event
  const targetMembers = members.filter(m => {
    if (!currentEvent) return true;
    if (currentEvent.divisionTarget === 'Semua Divisi') return true;
    return m.division === currentEvent.divisionTarget;
  });

  const recordMap = new Map<string, AttendanceRecord>();
  currentEventRecords.forEach(r => recordMap.set(r.memberId, r));

  const countHadir = currentEventRecords.filter(r => r.status === 'hadir').length;
  const countIzin = currentEventRecords.filter(r => r.status === 'izin').length;
  const countSakit = currentEventRecords.filter(r => r.status === 'sakit').length;
  const countAlpa = currentEventRecords.filter(r => r.status === 'alpa').length;
  const countUnrecorded = targetMembers.length - currentEventRecords.length;

  const attendancePercentage = targetMembers.length > 0
    ? Math.round((countHadir / targetMembers.length) * 100)
    : 0;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onCreateEvent({
      title: newTitle.trim(),
      type: newType,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      location: newLocation.trim(),
      locationType: newLocationType,
      status: 'active',
      divisionTarget: newDivisionTarget as any,
      organizer: newOrganizer.trim() || 'Organisasi',
      notes: newNotes.trim() || undefined,
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewNotes('');
  };

  const handleExportAttendanceCSV = () => {
    if (!currentEvent) return;
    const rows: (string | number)[][] = [
      ['KOP REKAPITULASI PRESENSI KEGIATAN'],
      ['Organisasi', config.name],
      ['Kegiatan', currentEvent.title],
      ['Tanggal', `${formatDateIndo(currentEvent.date)} (${currentEvent.startTime} - ${currentEvent.endTime} WIB)`],
      ['Lokasi', currentEvent.location],
      [''],
      ['No', 'NIM', 'Nama Anggota', 'Divisi / Departemen', 'Jabatan', 'Status Presensi', 'Waktu Presensi', 'Keterangan'],
    ];

    targetMembers.forEach((member, idx) => {
      const rec = recordMap.get(member.id);
      const statusText = rec ? rec.status.toUpperCase() : 'BELUM PRESENSI';
      const timeText = rec?.timestamp || '-';
      const noteText = rec?.notes || '-';
      rows.push([
        idx + 1,
        member.nim,
        member.name,
        member.division,
        member.role,
        statusText,
        timeText,
        noteText
      ]);
    });

    rows.push(['']);
    rows.push(['Ringkasan:', `Hadir: ${countHadir}`, `Izin: ${countIzin}`, `Sakit: ${countSakit}`, `Alpa: ${countAlpa}`]);
    rows.push(['Tingkat Kehadiran', `${attendancePercentage}%`]);

    exportToCSV(`Presensi_${currentEvent.title.replace(/\s+/g, '_')}_${currentEvent.date}`, rows);
  };

  const filteredMembersList = targetMembers.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.nim.includes(searchMember);
    const matchesDiv = divisionFilter === 'all' || m.division === divisionFilter;
    return matchesSearch && matchesDiv;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Manajemen Absensi & Kegiatan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {events.length} Kegiatan Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau kehadiran rapat, evaluasi, proker, kumpul rutin serta cetak rekapitulasi kehadiran resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-open-self-checkin"
            onClick={onOpenSelfCheckIn}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors border border-indigo-200"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>Presensi Mandiri / QR</span>
          </button>
          
          <button
            id="btn-create-event-modal"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Sesi Kegiatan</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('live')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeSubTab === 'live'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pengisian Presensi Sesi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recap')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeSubTab === 'recap'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Matriks & Rekapitulasi Presensi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('events')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeSubTab === 'events'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Daftar Seluruh Kegiatan ({events.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: LIVE ATTENDANCE MANAGER */}
      {activeSubTab === 'live' && (
        <div className="space-y-6">
          
          {/* Sesi Selector & Event Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Pilih Kegiatan yang Sedang Dinilai / Diabsen:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      [{evt.status === 'active' ? '🟢 BERLANGSUNG' : evt.status === 'upcoming' ? '🟡 TERJADWAL' : '⚪ SELESAI'}] {evt.title} ({formatDateIndo(evt.date)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportAttendanceCSV}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-200"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor CSV</span>
                </button>
                <button
                  onClick={onPrintReport}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-200"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Cetak Presensi</span>
                </button>
              </div>
            </div>

            {/* Event Details Ribbon */}
            {currentEvent && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{currentEvent.title}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-2xs uppercase">
                      {currentEvent.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-slate-600">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      {formatDateIndo(currentEvent.date)} • {currentEvent.startTime} - {currentEvent.endTime} WIB
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      {currentEvent.location}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      Target: {currentEvent.divisionTarget}
                    </span>
                  </div>
                </div>

                {/* Progress Mini Meter */}
                <div className="text-right">
                  <span className="text-2xs text-slate-500 font-semibold uppercase">Kehadiran</span>
                  <p className="text-lg font-black text-indigo-700 font-mono">
                    {attendancePercentage}% ({countHadir}/{targetMembers.length})
                  </p>
                </div>
              </div>
            )}

            {/* Quick Status Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <p className="text-2xs font-bold text-emerald-700 uppercase">Hadir</p>
                <p className="text-xl font-black text-emerald-800 font-mono mt-0.5">{countHadir}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-2xs font-bold text-amber-700 uppercase">Izin</p>
                <p className="text-xl font-black text-amber-800 font-mono mt-0.5">{countIzin}</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <p className="text-2xs font-bold text-rose-700 uppercase">Sakit</p>
                <p className="text-xl font-black text-rose-800 font-mono mt-0.5">{countSakit}</p>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center">
                <p className="text-2xs font-bold text-slate-600 uppercase">Alpa / Bolos</p>
                <p className="text-xl font-black text-slate-700 font-mono mt-0.5">{countAlpa}</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center col-span-2 sm:col-span-1">
                <p className="text-2xs font-bold text-indigo-700 uppercase">Belum Absen</p>
                <p className="text-xl font-black text-indigo-800 font-mono mt-0.5">{Math.max(0, countUnrecorded)}</p>
              </div>
            </div>

          </div>

          {/* Member Attendance Checklist Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama anggota atau NIM..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Semua Sekbid</option>
                  <option value="Badan Pengurus Harian (BPH)">BPH</option>
                  <option value="Sekbid 1 (Keimanan & Ketakwaan)">Sekbid 1</option>
                  <option value="Sekbid 2 (Budi Pekerti & Akhlak Mulia)">Sekbid 2</option>
                  <option value="Sekbid 3 (Bela Negara & Wawasan Kebangsaan)">Sekbid 3</option>
                  <option value="Sekbid 4 (Akademik, Seni & Olahraga)">Sekbid 4</option>
                  <option value="Sekbid 5 (Demokrasi & Lingkungan Hidup)">Sekbid 5</option>
                  <option value="Sekbid 6 (Kreativitas & Kewirausahaan)">Sekbid 6</option>
                  <option value="Sekbid 7 (Kesehatan Jasmani & Gizi)">Sekbid 7</option>
                  <option value="Sekbid 8 (Sastra & Budaya)">Sekbid 8</option>
                  <option value="Sekbid 9 (TIK & Publikasi Media)">Sekbid 9</option>
                  <option value="Sekbid 10 (Komunikasi Bahasa Asing)">Sekbid 10</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase text-2xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Anggota</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Sekbid & Jabatan</th>
                    <th className="py-3.5 px-4">Status Presensi</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Waktu & Catatan</th>
                    <th className="py-3.5 px-4 text-center">Tandai Status Cepat (1-Klik)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada anggota ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredMembersList.map((member) => {
                      const record = recordMap.get(member.id);
                      const status = record?.status;

                      return (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">{member.name}</p>
                                <p className="text-2xs text-slate-500 font-mono">{member.nim}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 hidden md:table-cell">
                            <p className="text-xs font-semibold text-slate-800">{member.division}</p>
                            <p className="text-2xs text-slate-500">{member.role}</p>
                          </td>

                          <td className="py-3 px-4">
                            {status === 'hadir' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Hadir
                              </span>
                            )}
                            {status === 'izin' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                Izin
                              </span>
                            )}
                            {status === 'sakit' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
                                <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                Sakit
                              </span>
                            )}
                            {status === 'alpa' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-700">
                                <X className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                Alpa
                              </span>
                            )}
                            {!status && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold text-slate-400 bg-slate-100">
                                Belum Absen
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 hidden sm:table-cell text-xs text-slate-500">
                            {record ? (
                              <div>
                                <p className="font-mono text-2xs">{record.timestamp}</p>
                                {record.notes && <p className="text-slate-700 italic text-2xs mt-0.5 font-medium">"{record.notes}"</p>}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl space-x-1">
                              <button
                                title="Set Hadir"
                                onClick={() => {
                                  const eventId = currentEvent?.id || events[0]?.id;
                                  if (!eventId) {
                                    alert('Silakan buat Sesi Kegiatan Rapat terlebih dahulu.');
                                    return;
                                  }
                                  onUpdateRecordStatus(eventId, member.id, 'hadir');
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'hadir'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                H
                              </button>
                              <button
                                title="Set Izin"
                                onClick={() => {
                                  const eventId = currentEvent?.id || events[0]?.id;
                                  if (!eventId) {
                                    alert('Silakan buat Sesi Kegiatan Rapat terlebih dahulu.');
                                    return;
                                  }
                                  const currentRecord = recordMap.get(member.id);
                                  setReasonModal({
                                    isOpen: true,
                                    member,
                                    eventId,
                                    status: 'izin',
                                    reasonText: currentRecord?.notes || '',
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'izin'
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                I
                              </button>
                              <button
                                title="Set Sakit"
                                onClick={() => {
                                  const eventId = currentEvent?.id || events[0]?.id;
                                  if (!eventId) {
                                    alert('Silakan buat Sesi Kegiatan Rapat terlebih dahulu.');
                                    return;
                                  }
                                  const currentRecord = recordMap.get(member.id);
                                  setReasonModal({
                                    isOpen: true,
                                    member,
                                    eventId,
                                    status: 'sakit',
                                    reasonText: currentRecord?.notes || '',
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'sakit'
                                    ? 'bg-rose-500 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                S
                              </button>
                              <button
                                title="Set Alpa"
                                onClick={() => {
                                  const eventId = currentEvent?.id || events[0]?.id;
                                  if (!eventId) {
                                    alert('Silakan buat Sesi Kegiatan Rapat terlebih dahulu.');
                                    return;
                                  }
                                  onUpdateRecordStatus(eventId, member.id, 'alpa');
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'alpa'
                                    ? 'bg-slate-700 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                A
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: RECAP MATRIX */}
      {activeSubTab === 'recap' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Matriks Rekapitulasi Presensi Seluruh Anggota</h2>
              <p className="text-xs text-slate-500">Rekap kehadiran per individu di seluruh kegiatan resmi organisasi</p>
            </div>
            <button
              onClick={() => {
                const rows: (string | number)[][] = [
                  ['REKAPITULASI PRESENSI ANGGOTA LENGKAP'],
                  ['Organisasi', config.name],
                  ['Periode', config.period],
                  [''],
                  ['No', 'NIM', 'Nama Anggota', 'Sekbid', ...events.map(e => e.title), 'Total Hadir', 'Persentase'],
                ];

                members.forEach((m, idx) => {
                  let hadirCount = 0;
                  const rowData: (string | number)[] = [idx + 1, m.nim, m.name, m.division];
                  events.forEach(e => {
                    const rec = records.find(r => r.eventId === e.id && r.memberId === m.id);
                    if (rec?.status === 'hadir') hadirCount++;
                    rowData.push(rec ? rec.status.toUpperCase() : '-');
                  });
                  const rate = events.length > 0 ? Math.round((hadirCount / events.length) * 100) : 0;
                  rowData.push(hadirCount, `${rate}%`);
                  rows.push(rowData);
                });

                exportToCSV(`Rekapitulasi_Presensi_Lengkap_${config.shortName}`, rows);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Matriks CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-2xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 border-r border-slate-200">Anggota</th>
                  <th className="py-3 px-3 border-r border-slate-200">Divisi</th>
                  {events.map((e, idx) => (
                    <th key={e.id} className="py-3 px-2 border-r border-slate-200 text-center max-w-[120px] truncate" title={e.title}>
                      K-{idx + 1}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center">Hadir</th>
                  <th className="py-3 px-3 text-center">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  let hadirCount = 0;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {member.name}
                        <span className="block text-2xs text-slate-500 font-normal">{member.nim}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap text-2xs">
                        {member.division}
                      </td>

                      {events.map((e) => {
                        const rec = records.find(r => r.eventId === e.id && r.memberId === member.id);
                        if (rec?.status === 'hadir') hadirCount++;

                        return (
                          <td key={e.id} className="py-2.5 px-1.5 text-center border-r border-slate-200">
                            {rec?.status === 'hadir' && (
                              <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs leading-5">H</span>
                            )}
                            {rec?.status === 'izin' && (
                              <span className="inline-block w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-2xs leading-5">I</span>
                            )}
                            {rec?.status === 'sakit' && (
                              <span className="inline-block w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-2xs leading-5">S</span>
                            )}
                            {rec?.status === 'alpa' && (
                              <span className="inline-block w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-2xs leading-5">A</span>
                            )}
                            {!rec && <span className="text-slate-300 font-bold">-</span>}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800">
                        {hadirCount} / {events.length}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold ${
                          (hadirCount / events.length) >= 0.75 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : (hadirCount / events.length) >= 0.5 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {Math.round((hadirCount / (events.length || 1)) * 100)}%
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
            <span className="font-bold">Keterangan:</span>
            <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs inline-flex items-center justify-center mr-1">H</span> Hadir</span>
            <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold text-2xs inline-flex items-center justify-center mr-1">I</span> Izin</span>
            <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold text-2xs inline-flex items-center justify-center mr-1">S</span> Sakit</span>
            <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-2xs inline-flex items-center justify-center mr-1">A</span> Alpa</span>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: ALL EVENTS LIST */}
      {activeSubTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => {
            const evtRecords = records.filter(r => r.eventId === evt.id);
            const hadirTotal = evtRecords.filter(r => r.status === 'hadir').length;
            const rate = members.length > 0 ? Math.round((hadirTotal / members.length) * 100) : 0;

            return (
              <div 
                key={evt.id} 
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-2xs font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {evt.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                      evt.status === 'active' ? 'bg-emerald-100 text-emerald-800' : evt.status === 'upcoming' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {evt.status === 'active' ? 'Berlangsung' : evt.status === 'upcoming' ? 'Terjadwal' : 'Selesai'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-3 leading-snug">
                    {evt.title}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <p className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                      {formatDateIndo(evt.date)} ({evt.startTime} - {evt.endTime} WIB)
                    </p>
                    <p className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                      {evt.location}
                    </p>
                    <p className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                      Penyelenggara: {evt.organizer}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-2xs text-slate-400 uppercase font-semibold">Tingkat Hadir</span>
                    <p className="text-sm font-bold text-indigo-700 font-mono">{hadirTotal} Anggota ({rate}%)</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEventId(evt.id);
                      setActiveSubTab('live');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Buka Sesi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5" />
                <h2 className="text-base font-bold">Buat Sesi Kegiatan Baru</h2>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kegiatan / Agenda *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Koordinasi Panitia / Workshop..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kegiatan *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="Rapat Pleno">Rapat Pleno</option>
                    <option value="Rapat Pengurus Harian">Rapat Pengurus Harian</option>
                    <option value="Rapat Divisi">Rapat Divisi</option>
                    <option value="Proker / Acara Utama">Proker / Acara Utama</option>
                    <option value="Kumpul Rutin">Kumpul Rutin</option>
                    <option value="Workshop / Pelatihan">Workshop / Pelatihan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang Seminar Lt. 2 / Zoom Meeting"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Anggota</label>
                  <select
                    value={newDivisionTarget}
                    onChange={(e) => setNewDivisionTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="Semua Divisi">Semua Divisi</option>
                    <option value="Badan Pengurus Harian (BPH)">BPH</option>
                    <option value="Divisi Acara & Program">Divisi Acara</option>
                    <option value="Divisi Humas & Eksternal">Divisi Humas</option>
                    <option value="Divisi Media & Kreatif">Divisi Medkraf</option>
                    <option value="Divisi Logistik & Perlengkapan">Divisi Logistik</option>
                    <option value="Divisi Danus (Dana Usaha)">Divisi Danus</option>
                    <option value="Divisi Litbang & Keilmuan">Divisi Litbang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Divisi Penyelenggara</label>
                  <input
                    type="text"
                    value={newOrganizer}
                    onChange={(e) => setNewOrganizer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Deskripsi Agenda</label>
                <textarea
                  rows={2}
                  placeholder="Agenda bahasan, perlengkapan yang perlu dibawa..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Simpan & Buat Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keren & Elegant Modal Input Keterangan Izin / Sakit */}
      {reasonModal.isOpen && reasonModal.member && reasonModal.eventId && reasonModal.status && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 transform animate-in zoom-in-95 duration-200">
            
            {/* Header Banner */}
            <div className={`p-5 text-white flex items-center justify-between ${
              reasonModal.status === 'izin' 
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500' 
                : 'bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-extrabold text-lg text-white shadow-inner">
                  {reasonModal.status === 'izin' ? 'I' : 'S'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Keterangan {reasonModal.status === 'izin' ? 'Izin' : 'Sakit'} Presensi
                  </h3>
                  <p className="text-2xs text-white/80 font-medium">
                    Sistem Presensi Digital OSIS SKARLAKES
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReasonModal({ isOpen: false, reasonText: '' })}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">

              {/* Member Target Card */}
              <div className="flex items-center space-x-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {reasonModal.member.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm truncate">{reasonModal.member.name}</p>
                  <p className="text-2xs text-slate-500 font-mono">
                    NIM: {reasonModal.member.nim} • {reasonModal.member.division}
                  </p>
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pilihan Keterangan Cepat (1-Klik):</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(reasonModal.status === 'izin' ? [
                    'Dispen Lomba / Acara Sekolah',
                    'Izin Keperluan Keluarga',
                    'Kegiatan Organisasi Outside',
                    'Perjalanan Luar Kota',
                    'Keperluan Mendadak',
                  ] : [
                    'Sakit Demam & Flu',
                    'Surat Dokter / Rawat Inap',
                    'Kondisi Fisik Kurang Fit',
                    'Istirahat di Rumah',
                    'Pemeriksaan Kesehatan',
                  ]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReasonModal(prev => ({ ...prev, reasonText: preset }))}
                      className={`text-2xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                        reasonModal.reasonText === preset
                          ? reasonModal.status === 'izin'
                            ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold shadow-2xs'
                            : 'bg-rose-50 text-rose-900 border-rose-400 font-bold shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detail Alasan / Catatan:
                </label>
                <textarea
                  rows={3}
                  placeholder={`Ketikkan detail alasan ${reasonModal.status === 'izin' ? 'izin' : 'sakit'} di sini...`}
                  value={reasonModal.reasonText}
                  onChange={(e) => setReasonModal(prev => ({ ...prev, reasonText: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReasonModal({ isOpen: false, reasonText: '' })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateRecordStatus(
                      reasonModal.eventId!,
                      reasonModal.member!.id,
                      reasonModal.status!,
                      reasonModal.reasonText.trim() || undefined
                    );
                    setReasonModal({ isOpen: false, reasonText: '' });
                  }}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 ${
                    reasonModal.status === 'izin'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Status {reasonModal.status === 'izin' ? 'Izin' : 'Sakit'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
