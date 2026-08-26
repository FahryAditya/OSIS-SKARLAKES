import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, AlertCircle, Clock, MapPin, Search, Sparkles, Copy, Check, UserPlus, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceEvent, Member, AttendanceRecord, AttendanceStatus, OrganizationConfig } from '../types';
import { generateQRCodeDataURL, formatDateIndo } from '../utils/formatters';

interface SelfCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: AttendanceEvent[];
  members: Member[];
  attendanceRecords: AttendanceRecord[];
  onRecordAttendance: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => void;
  config: OrganizationConfig;
  initialSelectedEventId?: string;
}

export const SelfCheckInModal: React.FC<SelfCheckInModalProps> = ({
  isOpen,
  onClose,
  events,
  members,
  attendanceRecords,
  onRecordAttendance,
  config,
  initialSelectedEventId,
}) => {
  const activeOrUpcomingEvents = events.filter(e => e.status === 'active' || e.status === 'upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialSelectedEventId || activeOrUpcomingEvents[0]?.id || events[0]?.id || ''
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [webPresensiUrl, setWebPresensiUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  
  // Custom manual entry fallback if member is not in list
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualNim, setManualNim] = useState('');
  const [manualDivision, setManualDivision] = useState('Badan Pengurus Harian (BPH)');

  const [status, setStatus] = useState<AttendanceStatus>('hadir');
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'kiosk' | 'qr'>('kiosk');

  // Update selected event if prop changes
  useEffect(() => {
    if (initialSelectedEventId && events.some(e => e.id === initialSelectedEventId)) {
      setSelectedEventId(initialSelectedEventId);
    } else if (!selectedEventId && events.length > 0) {
      setSelectedEventId(activeOrUpcomingEvents[0]?.id || events[0]?.id);
    }
  }, [initialSelectedEventId, events]);

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Generate QR Code containing URL to directly open web page when scanned
  useEffect(() => {
    if (currentEvent && typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const targetUrl = `${origin}${pathname}?presensi=true&eventId=${currentEvent.id}&token=${encodeURIComponent(currentEvent.qrCodeToken)}`;
      setWebPresensiUrl(targetUrl);

      generateQRCodeDataURL(targetUrl).then(url => setQrDataUrl(url));
    }
  }, [currentEvent]);

  if (!isOpen) return null;

  const currentEventRecords = attendanceRecords.filter(r => r.eventId === (currentEvent?.id || ''));
  const presentMemberIds = new Set(currentEventRecords.map(r => r.memberId));

  const filteredMembers = members.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.nim.toLowerCase().includes(q) ||
      (m.kelas && m.kelas.toLowerCase().includes(q)) ||
      m.division.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const handleCopyLink = () => {
    if (webPresensiUrl) {
      navigator.clipboard.writeText(webPresensiUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;

    let memberId = selectedMemberId;
    let memberName = '';
    let memberNim = '';
    let division: any = 'Badan Pengurus Harian (BPH)';

    if (isManualEntry) {
      if (!manualName.trim()) {
        alert('Harap masukkan Nama Lengkap Anda.');
        return;
      }
      memberName = manualName.trim();
      memberNim = manualNim.trim() || `TAMU-${Date.now().toString().slice(-4)}`;
      division = manualDivision as any;
      memberId = `manual-${Date.now()}`;
    } else {
      if (!selectedMemberId) {
        alert('Harap pilih Nama atau NIS/NIM Anda terlebih dahulu.');
        return;
      }
      const member = members.find(m => m.id === selectedMemberId);
      if (!member) return;

      // Check if already checked in
      const alreadyRecorded = currentEventRecords.find(r => r.memberId === selectedMemberId);
      if (alreadyRecorded) {
        alert(`Anggota ${member.name} sudah tercatat presensi (${alreadyRecorded.status.toUpperCase()}) pada sesi ini.`);
        return;
      }

      memberName = member.name;
      memberNim = member.nim;
      division = member.division;
    }

    onRecordAttendance({
      eventId: currentEvent.id,
      memberId: memberId,
      memberName: memberName,
      memberNim: memberNim,
      division: division,
      status: status,
      notes: reason.trim() ? reason.trim() : undefined,
    });

    if (status === 'hadir') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
        });
      } catch (err) {
        console.error(err);
      }
    }

    setSuccessMessage(`Berhasil mencatat presensi: ${memberName} (${status.toUpperCase()})`);
    setSelectedMemberId('');
    setManualName('');
    setManualNim('');
    setReason('');
    setSearchQuery('');

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <img 
              src={config.logoUrl || '/logo.png'} 
              alt={`Logo ${config.shortName}`} 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-xs shrink-0 bg-white" 
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">Portal Presensi Mandiri</h2>
              <p className="text-2xs sm:text-xs text-indigo-200 font-medium truncate max-w-xs sm:max-w-md">
                {config.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Selector & Mode Switcher */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="mb-3">
            <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Pilih Sesi Kegiatan / Rapat:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  [{evt.status === 'active' ? '🟢 BERLANGSUNG' : evt.status === 'upcoming' ? '🟡 TERJADWAL' : '⚪ SELESAI'}] {evt.title} ({formatDateIndo(evt.date)})
                </option>
              ))}
            </select>
          </div>

          {currentEvent && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1 text-xs text-slate-600">
              <div className="flex items-center justify-between font-bold text-slate-900 text-xs sm:text-sm">
                <span className="truncate max-w-[280px] sm:max-w-md">{currentEvent.title}</span>
                <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase shrink-0 ${
                  currentEvent.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {currentEvent.type}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-2xs sm:text-xs">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600 shrink-0" />
                  {formatDateIndo(currentEvent.date)} • {currentEvent.startTime} - {currentEvent.endTime} WIB
                </span>
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-600 shrink-0" />
                  {currentEvent.location}
                </span>
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex space-x-2 mt-3.5">
            <button
              onClick={() => setActiveTab('kiosk')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl text-center transition-all ${
                activeTab === 'kiosk'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Mode Form Check-In Mandiri
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl text-center transition-all ${
                activeTab === 'qr'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tampilkan QR Code Sesi (Scan Web)
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center animate-in fade-in duration-200 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center justify-center text-center p-2 sm:p-4 space-y-4">
              <div className="p-4 bg-white border-2 border-indigo-200 rounded-2xl shadow-lg inline-block relative group">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Presensi Web" className="w-52 h-52 sm:w-60 sm:h-60 mx-auto object-contain" />
                ) : (
                  <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Memuat QR Code Web...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded-full border border-indigo-200">
                  Token: {currentEvent?.qrCodeToken}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  Pindai QR Code untuk Langsung Buka Web Presensi
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tampilkan layar ini di proyektor rapat atau bagikan link ke anggota OSIS SKARLAKES (SMK Airlangga & SMK Kesehatan Airlangga).
                </p>
              </div>

              {/* Copy Link Button */}
              <div className="w-full max-w-md pt-2">
                <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={webPresensiUrl}
                    className="flex-1 bg-transparent text-2xs sm:text-xs font-mono text-slate-600 outline-hidden px-2 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1 transition-all ${
                      isCopied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Hadir: <b className="text-slate-900">{currentEventRecords.filter(r => r.status === 'hadir').length} Orang</b></span>
                <span>Total Anggota: <b className="text-slate-900">{members.length} Orang</b></span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} className="space-y-4">
              
              {/* Member Selection Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider">
                    Cari Nama atau NIS/NIM Anda:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualEntry(!isManualEntry);
                      setSelectedMemberId('');
                    }}
                    className="text-2xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{isManualEntry ? 'Pilih Dari Daftar' : 'Tulis Nama Manual / Tamu'}</span>
                  </button>
                </div>

                {isManualEntry ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div>
                      <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                        Nama Lengkap Siswa / Anggota *
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso (XI RPL 1)"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                          NIS / NIM / Kelas
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: XI RPL 1 / 2026011"
                          value={manualNim}
                          onChange={(e) => setManualNim(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                          Divisi / Sekolah
                        </label>
                        <select
                          value={manualDivision}
                          onChange={(e) => setManualDivision(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Badan Pengurus Harian (BPH)">Badan Pengurus Harian (BPH)</option>
                          <option value="Sekbid 1 (Keimanan & Ketakwaan)">Sekbid 1 (Keimanan & Ketakwaan)</option>
                          <option value="Sekbid 2 (Budi Pekerti & Akhlak Mulia)">Sekbid 2 (Budi Pekerti & Akhlak Mulia)</option>
                          <option value="Sekbid 3 (Bela Negara & Wawasan Kebangsaan)">Sekbid 3 (Bela Negara & Wawasan Kebangsaan)</option>
                          <option value="Sekbid 4 (Akademik, Seni & Olahraga)">Sekbid 4 (Akademik, Seni & Olahraga)</option>
                          <option value="Sekbid 5 (Demokrasi & Lingkungan Hidup)">Sekbid 5 (Demokrasi & Lingkungan Hidup)</option>
                          <option value="Sekbid 6 (Kreativitas & Kewirausahaan)">Sekbid 6 (Kreativitas & Kewirausahaan)</option>
                          <option value="Sekbid 7 (Kesehatan Jasmani & Gizi)">Sekbid 7 (Kesehatan Jasmani & Gizi)</option>
                          <option value="Sekbid 8 (Sastra & Budaya)">Sekbid 8 (Sastra & Budaya)</option>
                          <option value="Sekbid 9 (TIK & Publikasi Media)">Sekbid 9 (TIK & Publikasi Media)</option>
                          <option value="Sekbid 10 (Komunikasi Bahasa Asing)">Sekbid 10 (Komunikasi Bahasa Asing)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Scroll Down Dropdown SELECT */}
                    <div className="mb-2">
                      <div className="relative">
                        <select
                          value={selectedMemberId}
                          onChange={(e) => {
                            setSelectedMemberId(e.target.value);
                            setSearchQuery('');
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Scroll Down & Pilih Nama Anda ({members.length} Anggota) --</option>
                          {members.map((m) => {
                            const isPresent = presentMemberIds.has(m.id);
                            return (
                              <option key={m.id} value={m.id} disabled={isPresent}>
                                {isPresent ? '✓ ' : ''}{m.name} {m.kelas ? `(${m.kelas})` : ''} • {m.division} {isPresent ? '[SUDAH PRESENSI]' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Quick Search Input */}
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ketik nama atau NIS/NIM untuk filter cepat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                        >
                          Batal
                        </button>
                      )}
                    </div>

                    {/* Scrollable Member Card List */}
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                      {filteredMembers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          <p className="font-semibold text-slate-700">Tidak ada anggota yang cocok dengan pencarian.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualEntry(true);
                              setManualName(searchQuery);
                            }}
                            className="mt-2 text-indigo-600 hover:text-indigo-800 font-bold underline"
                          >
                            + Tulis Nama "{searchQuery}" Secara Manual
                          </button>
                        </div>
                      ) : (
                        filteredMembers.map((m) => {
                          const isPresent = presentMemberIds.has(m.id);
                          const isSelected = selectedMemberId === m.id;
                          const existingRecord = currentEventRecords.find(r => r.memberId === m.id);

                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                if (!isPresent) {
                                  setSelectedMemberId(m.id);
                                }
                              }}
                              className={`p-3 flex items-center justify-between transition-colors ${
                                isPresent 
                                  ? 'bg-slate-50 opacity-60 cursor-not-allowed' 
                                  : isSelected
                                    ? 'bg-indigo-50/90 border-l-4 border-indigo-600 cursor-pointer'
                                    : 'hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {m.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{m.name}</p>
                                  <p className="text-2xs text-slate-500 truncate">
                                    {m.kelas ? `${m.kelas} • ` : ''}{m.nim} • {m.division}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 ml-2">
                                {isPresent ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800 uppercase">
                                    ✓ {existingRecord?.status}
                                  </span>
                                ) : isSelected ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-indigo-600 text-white">
                                    Terpilih
                                  </span>
                                ) : (
                                  <span className="text-xs text-indigo-600 font-bold hover:underline">
                                    Pilih
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Status Radio Buttons */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Status Kehadiran:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('hadir')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      status === 'hadir'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hadir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('izin')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      status === 'izin'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Izin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('sakit')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      status === 'sakit'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Sakit</span>
                  </button>
                </div>
              </div>

              {/* Reason Input if Izin or Sakit */}
              {status !== 'hadir' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan Alasan ({status.toUpperCase()}) *
                  </label>
                  <textarea
                    rows={2}
                    placeholder={`Tuliskan alasan ${status}...`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!isManualEntry && !selectedMemberId}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all ${
                  isManualEntry || selectedMemberId
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Simpan Presensi Kehadiran</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
