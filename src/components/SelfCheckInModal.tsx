import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, AlertCircle, Clock, MapPin, Search, Sparkles } from 'lucide-react';
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
}

export const SelfCheckInModal: React.FC<SelfCheckInModalProps> = ({
  isOpen,
  onClose,
  events,
  members,
  attendanceRecords,
  onRecordAttendance,
  config,
}) => {
  const activeOrUpcomingEvents = events.filter(e => e.status === 'active' || e.status === 'upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    activeOrUpcomingEvents[0]?.id || events[0]?.id || ''
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [status, setStatus] = useState<AttendanceStatus>('hadir');
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'kiosk' | 'qr'>('kiosk');

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];

  useEffect(() => {
    if (currentEvent) {
      const qrPayload = JSON.stringify({
        org: config.shortName,
        eventId: currentEvent.id,
        token: currentEvent.qrCodeToken,
        title: currentEvent.title,
        date: currentEvent.date,
      });
      generateQRCodeDataURL(qrPayload).then(url => setQrDataUrl(url));
    }
  }, [currentEvent, config.shortName]);

  if (!isOpen) return null;

  const currentEventRecords = attendanceRecords.filter(r => r.eventId === selectedEventId);
  const presentMemberIds = new Set(currentEventRecords.map(r => r.memberId));

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nim.includes(searchQuery) ||
      m.division.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !currentEvent) return;

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    // Check if already checked in
    const alreadyRecorded = currentEventRecords.find(r => r.memberId === selectedMemberId);
    if (alreadyRecorded) {
      alert(`Anggota ${member.name} sudah tercatat presensi (${alreadyRecorded.status.toUpperCase()}) pada sesi ini.`);
      return;
    }

    onRecordAttendance({
      eventId: currentEvent.id,
      memberId: member.id,
      memberName: member.name,
      memberNim: member.nim,
      division: member.division,
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

    setSuccessMessage(`Berhasil mencatat presensi: ${member.name} (${status.toUpperCase()})`);
    setSelectedMemberId('');
    setReason('');
    setSearchQuery('');

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt={`Logo ${config.shortName}`} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-xs shrink-0 bg-white" 
              />
            ) : (
              <div className="p-2 bg-white/10 rounded-lg">
                <QrCode className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold">Portal Presensi Mandiri</h2>
              <p className="text-xs text-indigo-200">{config.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Selector & Mode Tabs */}
        <div className="p-6 pb-2 border-b border-slate-100 bg-slate-50">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Pilih Sesi Kegiatan / Rapat:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  [{evt.status === 'active' ? '🟢 BERLANGSUNG' : evt.status === 'upcoming' ? '🟡 TERJADWAL' : '⚪ SELESAI'}] {evt.title} ({formatDateIndo(evt.date)})
                </option>
              ))}
            </select>
          </div>

          {currentEvent && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between font-semibold text-slate-800 text-sm">
                <span>{currentEvent.title}</span>
                <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                  currentEvent.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {currentEvent.type}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  {formatDateIndo(currentEvent.date)} • {currentEvent.startTime} - {currentEvent.endTime} WIB
                </span>
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  {currentEvent.location}
                </span>
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setActiveTab('kiosk')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all ${
                activeTab === 'kiosk'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Mode Form Check-In Mandiri
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all ${
                activeTab === 'qr'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tampilkan QR Code Sesi
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center animate-fade-in">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="p-4 bg-white border-2 border-indigo-100 rounded-2xl shadow-md mb-4 inline-block">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Presensi" className="w-56 h-56 mx-auto object-contain" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    Memuat QR Code...
                  </div>
                )}
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded-full mb-2">
                Token: {currentEvent?.qrCodeToken}
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Pindai QR Code untuk Presensi Cepat
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tampilkan layar ini di proyektor rapat atau bagikan ke anggota organisasi saat sesi berlangsung.
              </p>

              <div className="mt-6 w-full pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Hadir Saat Ini: <b className="text-slate-800">{currentEventRecords.filter(r => r.status === 'hadir').length} Orang</b></span>
                <span>Total Anggota: <b className="text-slate-800">{members.length} Orang</b></span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Cari Nama atau NIM Anda:
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ketik nama atau NIM..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada anggota yang cocok dengan pencarian
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
                            if (!isPresent) setSelectedMemberId(m.id);
                          }}
                          className={`p-3 flex items-center justify-between transition-colors ${
                            isPresent 
                              ? 'bg-slate-50 opacity-60 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-indigo-50/80 border-l-4 border-indigo-600 cursor-pointer'
                                : 'hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                              <p className="text-xs text-slate-500">{m.nim} • {m.division}</p>
                            </div>
                          </div>

                          <div>
                            {isPresent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800 uppercase">
                                Sudah {existingRecord?.status}
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-indigo-600 text-white">
                                Terpilih
                              </span>
                            ) : (
                              <span className="text-xs text-indigo-600 font-medium hover:underline">
                                Pilih
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Status Kehadiran:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('hadir')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
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
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
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
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
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

              {/* Reason input if Izin / Sakit */}
              {status !== 'hadir' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keterangan Alasan ({status.toUpperCase()}):
                  </label>
                  <textarea
                    rows={2}
                    placeholder={`Tuliskan alasan ${status}...`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedMemberId}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                  selectedMemberId
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer'
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
