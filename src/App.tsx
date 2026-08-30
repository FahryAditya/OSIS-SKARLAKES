import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ActiveTab, 
  OrganizationConfig, 
  Member, 
  AttendanceEvent, 
  AttendanceRecord, 
  Transaction, 
  MonthlyDuesRecord, 
  BudgetPlan, 
  AttendanceStatus,
  TransactionType,
  SekbidDetail,
  SekbidMember,
  SystemUpdate,
} from './types';
import { 
  initialOrganizationConfig, 
  initialSystemUpdates
} from './data/initialData';
import { initialSekbidList } from './data/sekbidData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SekbidView } from './components/SekbidView';
import { AttendanceView } from './components/AttendanceView';
import { FinanceView } from './components/FinanceView';
import { DuesView } from './components/DuesView';
import { ReportsView } from './components/ReportsView';
import { MembersView } from './components/MembersView';
import { SettingsView } from './components/SettingsView';
import { UpdatesView } from './components/UpdatesView';
import { SelfCheckInModal } from './components/SelfCheckInModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AuthModal } from './components/AuthModal';
import { LoginView } from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  FeedbackNotification, 
  FeedbackToastItem, 
  ActionFeedbackModalData, 
  FeedbackType, 
  playActionFeedbackSound, 
  triggerConfettiBurst 
} from './components/FeedbackNotification';
import { initAuth, logoutUser, getCurrentStoredSession } from './services/authService';
import { 
  fetchAllData, 
  saveConfig, 
  saveMember, 
  deleteMember, 
  bulkSaveMembers,
  saveEvent, 
  deleteEvent, 
  bulkSaveEvents,
  saveAttendanceRecord, 
  deleteAttendanceRecord, 
  bulkSaveAttendance,
  saveTransaction, 
  deleteTransaction, 
  bulkSaveTransactions,
  saveDuesRecord, 
  deleteDuesRecord, 
  bulkSaveDues,
  saveBudgetPlan, 
  deleteBudgetPlan, 
  bulkSaveBudget,
  saveSekbidMember, 
  deleteSekbidMember, 
  bulkSaveSekbidMembers,
  saveSekbidDetails,
  syncAllToDb 
} from './services/dbService';
import { User } from 'firebase/auth';
import { formatRupiah } from './utils/formatters';
import { RefreshCw, UploadCloud, Database } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<OrganizationConfig>(initialOrganizationConfig);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [duesRecords, setDuesRecords] = useState<MonthlyDuesRecord[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);

  // 10 Sekbid OSIS State
  const [sekbidList, setSekbidList] = useState<SekbidDetail[]>(initialSekbidList);
  const [sekbidMembers, setSekbidMembers] = useState<SekbidMember[]>([]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentStoredSession());
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Google Sheets Database State
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [isPullingFromDb, setIsPullingFromDb] = useState(false);
  const [isPushingToDb, setIsPushingToDb] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals State
  const [isSelfCheckInOpen, setIsSelfCheckInOpen] = useState(false);
  const [presensiUrlEventId, setPresensiUrlEventId] = useState<string | undefined>(undefined);
  const [isQuickTransactionOpen, setIsQuickTransactionOpen] = useState(false);
  const [quickTransactionType, setQuickTransactionType] = useState<TransactionType>('masuk');

  // System Updates (Changelog) State
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>(initialSystemUpdates);

  const handleAddSystemUpdate = (newUpdate: Omit<SystemUpdate, 'id'>) => {
    const created: SystemUpdate = {
      ...newUpdate,
      id: `upd-${Date.now()}`,
    };
    setSystemUpdates(prev => [created, ...prev]);
    triggerActionFeedback('Log Update Disimpan!', `Versi ${created.version} (${created.title}) telah dicatat di Riwayat Update Sistem.`, {
      type: 'success',
      badge: 'Changelog',
    });
  };

  const handleDeleteSystemUpdate = (id: string) => {
    setSystemUpdates(prev => prev.filter(u => u.id !== id));
    triggerActionFeedback('Log Update Dihapus!', 'Catatan versi telah dihapus dari riwayat sistem.', {
      type: 'info',
      badge: 'Changelog',
    });
  };

  // Auto open self check-in modal if opened via QR Code scan URL (e.g. ?presensi=true&eventId=evt-01)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isPresensi = params.get('presensi');
      const eventIdParam = params.get('eventId');
      const tokenParam = params.get('token');

      if (isPresensi === 'true' || eventIdParam || tokenParam) {
        setIsSelfCheckInOpen(true);
        if (eventIdParam) {
          setPresensiUrlEventId(eventIdParam);
        } else if (tokenParam) {
          const found = events.find(e => e.qrCodeToken === tokenParam);
          if (found) setPresensiUrlEventId(found.id);
        }
      }
    }
  }, [events]);
  
  // Receipt Modal State
  const [receiptModalData, setReceiptModalData] = useState<{
    isOpen: boolean;
    dueRecord?: MonthlyDuesRecord | null;
    member?: Member | null;
    customDetails?: any;
  }>({ isOpen: false });

  // ==========================================
  // Feedback Animations & Toast Notification System
  // ==========================================
  const [toasts, setToasts] = useState<FeedbackToastItem[]>([]);
  const [actionModal, setActionModal] = useState<ActionFeedbackModalData | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((
    title: string, 
    message?: string, 
    type: FeedbackType = 'success',
    iconType?: 'check' | 'money' | 'attendance' | 'user' | 'sheet' | 'sparkles'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: FeedbackToastItem = {
      id,
      title,
      message,
      type,
      iconType,
      duration: 4000,
    };
    setToasts(prev => [...prev.slice(-4), newToast]);
    playActionFeedbackSound(type);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const triggerActionFeedback = useCallback((
    title: string,
    message: string,
    options?: {
      type?: FeedbackType;
      badge?: string;
      iconType?: 'check' | 'money' | 'attendance' | 'user' | 'sheet' | 'sparkles';
      withConfetti?: boolean;
      sound?: boolean;
    }
  ) => {
    const type = options?.type || 'success';
    setActionModal({
      isOpen: true,
      title,
      message,
      type,
      badge: options?.badge,
      iconType: options?.iconType,
    });

    if (options?.sound !== false) {
      playActionFeedbackSound(type);
    }

    if (options?.withConfetti || type === 'celebrate') {
      triggerConfettiBurst();
    }

    // Also add to toast feed
    showToast(title, message, type, options?.iconType);
  }, [showToast]);

  // Init Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setGoogleAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ==========================================
  // Attendance Handlers with Feedback
  // ==========================================
  const handleRecordAttendance = (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setAttendanceRecords(prev => [...prev, newRecord]);

    // Animated Feedback
    triggerActionFeedback(
      'Presensi Berhasil Dicatat!',
      `${record.memberName} tercatat ${record.status.toUpperCase()}`,
      {
        type: 'celebrate',
        iconType: 'attendance',
        badge: 'Absensi Kegiatan',
        withConfetti: true,
      }
    );

    // Auto-sync single record to NeonDB
    saveAttendanceRecord(newRecord).catch(err => {
      console.warn('NeonDB save attendance failed:', err);
    });
  };

  const handleUpdateRecordStatus = (eventId: string, memberId: string, status: AttendanceStatus, notes?: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const current = attendanceRecords.find(r => r.eventId === eventId && r.memberId === memberId);
    const updatedRecord: AttendanceRecord = current
      ? { ...current, status, notes: notes !== undefined ? notes : current.notes, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) }
      : {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          eventId, memberId, memberName: member.name, memberNim: member.nim,
          division: member.division, status, notes,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
    setAttendanceRecords(prev => {
      const existingIdx = prev.findIndex(r => r.eventId === eventId && r.memberId === memberId);

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = updatedRecord;
        return updated;
      } else {
        return [...prev, updatedRecord];
      }
    });
    saveAttendanceRecord(updatedRecord).catch(err => {
      console.error('NeonDB update attendance failed:', err);
      showToast('Gagal Menyimpan Presensi', err.message || 'Perubahan presensi belum tersimpan ke NeonDB', 'error');
    });

    showToast(
      'Status Presensi Diperbarui',
      `${member?.name || 'Anggota'} disetel menjadi ${status.toUpperCase()}`,
      'success',
      'attendance'
    );
  };

  const handleCreateEvent = (eventData: Omit<AttendanceEvent, 'id' | 'qrCodeToken'>) => {
    const newEvent: AttendanceEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      qrCodeToken: `${config.shortName}-${Date.now().toString(36).toUpperCase()}`,
    };
    setEvents(prev => [newEvent, ...prev]);
    saveEvent(newEvent).catch(err => {
      console.error('NeonDB save event failed:', err);
      showToast('Gagal Menyimpan Kegiatan', err.message || 'Kegiatan belum tersimpan ke NeonDB', 'error');
    });

    triggerActionFeedback(
      'Sesi Kegiatan Dibuat!',
      `Kegiatan "${newEvent.title}" dan QR Code presensi siap digunakan.`,
      {
        type: 'celebrate',
        iconType: 'attendance',
        badge: 'Kegiatan Baru',
        withConfetti: true,
      }
    );
  };

  // ==========================================
  // Transaction Handlers with Feedback
  // ==========================================
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Action animation feedback
    triggerActionFeedback(
      txData.type === 'masuk' ? 'Kas Masuk Berhasil Dicatat!' : 'Kas Keluar Berhasil Dicatat!',
      `${formatRupiah(txData.amount)} • ${txData.description}`,
      {
        type: 'success',
        iconType: 'money',
        badge: txData.type === 'masuk' ? 'Pemasukan Kas' : 'Pengeluaran Kas',
        withConfetti: txData.type === 'masuk',
      }
    );

    // Auto-sync single transaction to NeonDB
    saveTransaction(newTx).catch(err => {
      console.error('NeonDB save transaction failed:', err);
      showToast('Gagal Menyimpan Transaksi', err.message || 'Transaksi belum tersimpan ke NeonDB', 'error');
    });
  };

  // ==========================================
  // Dues Handlers with Feedback
  // ==========================================
  const handlePayDues = (
    memberId: string, 
    monthsToPay: number[], 
    paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet', 
    notes?: string,
    customAmount?: number,
    customLabel?: string,
    weeksToPay?: number[],
    selectedMonthForWeeks?: number
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const receiptNum = `KAS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const isWeekly = weeksToPay && weeksToPay.length > 0 && selectedMonthForWeeks !== undefined;

    const totalAmount = customAmount !== undefined && customAmount > 0 
      ? customAmount 
      : isWeekly 
        ? weeksToPay.length * (config.defaultWeeklyDue || 2500)
        : monthsToPay.length * (config.defaultMonthlyDue || 10000);

    let label = customLabel;
    if (!label) {
      if (isWeekly) {
        const mName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][(selectedMonthForWeeks || 1) - 1];
        label = `Iuran Mingguan (Mgg ${weeksToPay.join(', ')} - ${mName})`;
      } else {
        const monthNames = monthsToPay.map(m => ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m - 1]).join(', ');
        label = `Iuran Kas (${monthNames})`;
      }
    }

    const updatedDuesRecords: MonthlyDuesRecord[] = [];

    setDuesRecords(prev => {
      const existing = [...prev];

      if (isWeekly && selectedMonthForWeeks) {
        // Pay specific weeks for a month
        const m = selectedMonthForWeeks;
        const perWeekAmount = customAmount ? Math.round(customAmount / weeksToPay.length) : (config.defaultWeeklyDue || 2500);

        weeksToPay.forEach(w => {
          const idx = existing.findIndex(rec => rec.memberId === memberId && rec.year === 2026 && rec.month === m && rec.week === w);
          const newRecord: MonthlyDuesRecord = {
            id: idx >= 0 ? existing[idx].id : `due-${memberId}-2026-${m}-w${w}-${Date.now()}`,
            memberId,
            year: 2026,
            month: m,
            week: w,
            amount: perWeekAmount,
            status: 'lunas',
            paymentDate: todayStr,
            paymentMethod,
            receiptNumber: receiptNum,
            notes: notes || label,
          };
          if (idx >= 0) {
            existing[idx] = newRecord;
          } else {
            existing.push(newRecord);
          }
          updatedDuesRecords.push(newRecord);
        });

        // Check if all 4 weeks are now lunas for this month
        let paidWeeksCount = 0;
        for (let w = 1; w <= 4; w++) {
          if (existing.some(rec => rec.memberId === memberId && rec.year === 2026 && rec.month === m && rec.week === w && rec.status === 'lunas')) {
            paidWeeksCount++;
          }
        }
        if (paidWeeksCount >= 4) {
          const mIdx = existing.findIndex(rec => rec.memberId === memberId && rec.year === 2026 && rec.month === m && (!rec.week || rec.week === 0));
          const monthRecord: MonthlyDuesRecord = {
            id: mIdx >= 0 ? existing[mIdx].id : `due-${memberId}-2026-${m}-${Date.now()}`,
            memberId,
            year: 2026,
            month: m,
            amount: config.defaultMonthlyDue || 10000,
            status: 'lunas',
            paymentDate: todayStr,
            paymentMethod,
            receiptNumber: receiptNum,
            notes: `Lunas 4 Minggu - ${label}`,
          };
          if (mIdx >= 0) {
            existing[mIdx] = monthRecord;
          } else {
            existing.push(monthRecord);
          }
          updatedDuesRecords.push(monthRecord);
        }

      } else {
        // Pay full monthly mode
        monthsToPay.forEach(m => {
          const idx = existing.findIndex(rec => rec.memberId === memberId && rec.year === 2026 && rec.month === m && (!rec.week || rec.week === 0));
          const perMonthAmount = customAmount ? Math.round(customAmount / (monthsToPay.length || 1)) : (existing[idx]?.amount || config.defaultMonthlyDue);
          const monthRecord: MonthlyDuesRecord = {
            id: idx >= 0 ? existing[idx].id : `due-${memberId}-2026-${m}-${Date.now()}`,
            memberId,
            year: 2026,
            month: m,
            amount: perMonthAmount,
            status: 'lunas',
            paymentDate: todayStr,
            paymentMethod,
            receiptNumber: receiptNum,
            notes: notes || label,
          };

          if (idx >= 0) {
            existing[idx] = monthRecord;
          } else {
            existing.push(monthRecord);
          }
          updatedDuesRecords.push(monthRecord);

          // Also mark all 4 weeks as lunas
          for (let w = 1; w <= 4; w++) {
            const wIdx = existing.findIndex(rec => rec.memberId === memberId && rec.year === 2026 && rec.month === m && rec.week === w);
            const weekRecord: MonthlyDuesRecord = {
              id: wIdx >= 0 ? existing[wIdx].id : `due-${memberId}-2026-${m}-w${w}-${Date.now()}`,
              memberId,
              year: 2026,
              month: m,
              week: w,
              amount: Math.round(perMonthAmount / 4),
              status: 'lunas',
              paymentDate: todayStr,
              paymentMethod,
              receiptNumber: receiptNum,
              notes: notes || label,
            };
            if (wIdx >= 0) {
              existing[wIdx] = weekRecord;
            } else {
              existing.push(weekRecord);
            }
            updatedDuesRecords.push(weekRecord);
          }
        });
      }

      return existing;
    });

    // Save updated records to database
    Promise.all(updatedDuesRecords.map(record => saveDuesRecord(record))).catch(err => {
      console.error('NeonDB payment dues failed:', err);
      showToast('Gagal Menyimpan Iuran', err.message || 'Perubahan iuran belum tersimpan ke NeonDB', 'error');
    });

    // Auto-record into General Ledger (Buku Kas Masuk)
    handleSaveTransaction({
      type: 'masuk',
      category: 'Iuran Kas Anggota',
      amount: totalAmount,
      date: todayStr,
      description: `${label} a.n ${member.name}`,
      recipientOrPayer: member.name,
      recordedBy: config.treasurerName || 'Bendahara',
    });

    // Action feedback
    triggerActionFeedback(
      'Pembayaran Iuran Berhasil!',
      `${member.name} lunas ${label} total ${formatRupiah(totalAmount)}`,
      {
        type: 'celebrate',
        iconType: 'money',
        badge: 'Iuran Kas OSIS',
        withConfetti: true,
      }
    );

    // Open receipt modal immediately
    setReceiptModalData({
      isOpen: true,
      member,
      customDetails: {
        receiptNumber: receiptNum,
        payerName: member.name,
        description: `${label} (${config.period})`,
        amount: totalAmount,
        date: todayStr,
        paymentMethod,
      },
    });
  };

  // ==========================================
  // Member Handlers with Feedback
  // ==========================================
  const handleAddMember = (memberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...memberData,
      id: `m-${Date.now()}`,
    };
    setMembers(prev => [...prev, newMember]);
    saveMember(newMember).catch(err => {
      console.error('NeonDB save member failed:', err);
      showToast('Gagal Menyimpan Anggota', err.message || 'Anggota belum tersimpan ke NeonDB', 'error');
    });

    // Also create 12 months due records for the new member
    const newDues: MonthlyDuesRecord[] = [];
    for (let m = 1; m <= 12; m++) {
      newDues.push({
        id: `due-${newMember.id}-2026-${m}`,
        memberId: newMember.id,
        year: 2026,
        month: m,
        amount: config.defaultMonthlyDue,
        status: 'belum',
      });
    }
    setDuesRecords(prev => [...prev, ...newDues]);
    Promise.all(newDues.map(record => saveDuesRecord(record))).catch(err => {
      console.error('NeonDB save dues failed:', err);
      showToast('Gagal Menyimpan Iuran', err.message || 'Data iuran belum tersimpan ke NeonDB', 'error');
    });

    triggerActionFeedback(
      'Anggota Berhasil Ditambahkan!',
      `${newMember.name} (${newMember.division}) resmi terdaftar di database.`,
      {
        type: 'success',
        iconType: 'user',
        badge: 'Data Anggota',
      }
    );
  };

  const handleBulkAddMembers = (newMembersList: Omit<Member, 'id'>[]) => {
    if (newMembersList.length === 0) return;
    const baseTime = Date.now();
    const createdMembers: Member[] = newMembersList.map((mData, idx) => ({
      ...mData,
      id: `m-${baseTime}-${idx}`,
    }));

    setMembers(prev => [...prev, ...createdMembers]);
    Promise.all(createdMembers.map(member => saveMember(member))).catch(err => {
      console.error('NeonDB bulk save members failed:', err);
      showToast('Gagal Menyimpan Anggota', err.message || 'Data anggota belum tersimpan ke NeonDB', 'error');
    });

    // Create 12 months due records for each imported member
    const newDues: MonthlyDuesRecord[] = [];
    createdMembers.forEach(newMember => {
      for (let m = 1; m <= 12; m++) {
        newDues.push({
          id: `due-${newMember.id}-2026-${m}`,
          memberId: newMember.id,
          year: 2026,
          month: m,
          amount: config.defaultMonthlyDue,
          status: 'belum',
        });
      }
    });
    setDuesRecords(prev => [...prev, ...newDues]);
    Promise.all(newDues.map(record => saveDuesRecord(record))).catch(err => {
      console.error('NeonDB bulk save dues failed:', err);
      showToast('Gagal Menyimpan Iuran', err.message || 'Data iuran belum tersimpan ke NeonDB', 'error');
    });

    triggerActionFeedback(
      'Import Data Berhasil!',
      `Sebanyak ${createdMembers.length} data anggota/pengurus berhasil diimpor ke sistem.`,
      {
        type: 'celebrate',
        withConfetti: true,
        badge: 'Import Excel / CSV',
      }
    );
  };

  const handleUpdateMember = (id: string, updated: Partial<Member>) => {
    const existing = members.find(m => m.id === id);
    if (existing) saveMember({ ...existing, ...updated }).catch(err => {
      console.error('NeonDB update member failed:', err);
      showToast('Gagal Mengubah Anggota', err.message || 'Perubahan anggota belum tersimpan ke NeonDB', 'error');
    });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    showToast('Data Anggota Diperbarui', 'Perubahan biodata anggota berhasil disimpan', 'success', 'user');
  };

  const handleDeleteMember = (id: string) => {
    const member = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    setDuesRecords(prev => prev.filter(d => d.memberId !== id));
    setAttendanceRecords(prev => prev.filter(r => r.memberId !== id));
    deleteMember(id).catch(err => console.warn('NeonDB delete member failed:', err));
    showToast('Anggota Dihapus', `${member?.name || 'Anggota'} telah dihapus dari daftar.`, 'info');
  };

  const handleBulkDeleteMembers = (ids: string[], reasonTitle?: string) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setMembers(prev => prev.filter(m => !idSet.has(m.id)));
    setDuesRecords(prev => prev.filter(d => !idSet.has(d.memberId)));
    setAttendanceRecords(prev => prev.filter(r => !idSet.has(r.memberId)));
    Promise.all(ids.map(id => deleteMember(id))).catch(err => console.warn('NeonDB bulk delete members failed:', err));
    showToast(
      reasonTitle || 'Anggota Berhasil Dihapus',
      `Sebanyak ${ids.length} data anggota telah dihapus dari sistem.`,
      'info',
      'trash'
    );
  };

  // ==========================================
  // 10 Sekbid OSIS CRUD Handlers
  // ==========================================
  const handleAddSekbidMember = (memberData: Omit<SekbidMember, 'id'>) => {
    const newMember: SekbidMember = {
      ...memberData,
      id: `sm-${Date.now()}`,
    };
    setSekbidMembers(prev => [...prev, newMember]);
    saveSekbidMember(newMember).catch(err => {
      console.error('NeonDB save sekbid member failed:', err);
      showToast('Gagal Menyimpan Pengurus', err.message || 'Pengurus belum tersimpan ke NeonDB', 'error');
    });
    showToast('Pengurus Sekbid Ditambahkan', `${newMember.name} ditambahkan ke Sekbid ${newMember.sekbidId}`, 'success');
  };

  const handleUpdateSekbidMember = (id: string, updated: Partial<SekbidMember>) => {
    const existing = sekbidMembers.find(m => m.id === id);
    if (existing) saveSekbidMember({ ...existing, ...updated }).catch(err => {
      console.error('NeonDB update sekbid member failed:', err);
      showToast('Gagal Mengubah Pengurus', err.message || 'Perubahan pengurus belum tersimpan ke NeonDB', 'error');
    });
    setSekbidMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    showToast('Data Pengurus Sekbid Diperbarui', 'Perubahan anggota sekbid tersimpan', 'success');
  };

  const handleDeleteSekbidMember = (id: string) => {
    setSekbidMembers(prev => prev.filter(m => m.id !== id));
    deleteSekbidMember(id).catch(err => console.warn('NeonDB delete sekbid member failed:', err));
    showToast('Pengurus Sekbid Dihapus', 'Data anggota sekbid dihapus', 'info');
  };

  const handleUpdateSekbidDetail = (id: number, updated: Partial<SekbidDetail>) => {
    const nextSekbidList = sekbidList.map(s => s.id === id ? { ...s, ...updated } : s);
    setSekbidList(nextSekbidList);
    saveSekbidDetails(nextSekbidList)
      .then(() => {
        showToast('Program Kerja Sekbid Diperbarui', `Informasi Sekbid ${id} berhasil disimpan ke NeonDB`, 'success');
      })
      .catch(err => {
        console.error('NeonDB save sekbid details failed:', err);
        showToast('Gagal Menyimpan Info Sekbid', err.message || 'Perubahan belum tersimpan ke NeonDB', 'error');
      });
  };

  const handleResetSekbidData = () => {
    setSekbidList(initialSekbidList);
    setSekbidMembers([]);
    saveSekbidDetails(initialSekbidList).catch(err => console.warn('NeonDB reset sekbid details failed:', err));
    bulkSaveSekbidMembers([]).catch(err => console.warn('NeonDB reset sekbid failed:', err));
    showToast('Data Sekbid Direset', 'Struktur 10 Sekbid dikembalikan ke setelan awal OSIS', 'info');
  };

  // ==========================================
  // Budget Handlers
  // ==========================================
  const handleAddBudgetPlan = (plan: Omit<BudgetPlan, 'id'>) => {
    const newPlan: BudgetPlan = {
      ...plan,
      id: `rab-${Date.now()}`,
    };
    setBudgetPlans(prev => [...prev, newPlan]);
    saveBudgetPlan(newPlan).catch(err => {
      console.error('NeonDB save budget failed:', err);
      showToast('Gagal Menyimpan RAB', err.message || 'RAB belum tersimpan ke NeonDB', 'error');
    });
    triggerActionFeedback(
      'RAB Berhasil Ditambahkan!',
      `Anggaran "${newPlan.prokerName}" sebesar ${formatRupiah(newPlan.allocatedBudget)} telah dicatat.`,
      {
        type: 'success',
        iconType: 'money',
        badge: 'RAB Anggaran',
      }
    );
  };

  // ==========================================
  // Export / Import / Reset Handlers
  // ==========================================
  const handleExportAllData = () => {
    const backupData = {
      config,
      members,
      events,
      attendanceRecords,
      transactions,
      duesRecords,
      budgetPlans,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `Backup_${config.shortName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Cadangan Data Diunduh', 'File JSON cadangan database berhasil diekspor', 'success');
  };

  const handleImportData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.config) setConfig(parsed.config);
      if (parsed.members) setMembers(parsed.members);
      if (parsed.events) setEvents(parsed.events);
      if (parsed.attendanceRecords) setAttendanceRecords(parsed.attendanceRecords);
      if (parsed.transactions) setTransactions(parsed.transactions);
      if (parsed.duesRecords) setDuesRecords(parsed.duesRecords);
      if (parsed.budgetPlans) setBudgetPlans(parsed.budgetPlans);
      triggerActionFeedback('Data Berhasil Dipulihkan!', 'Semua data dari berkas cadangan JSON telah dimuat ke aplikasi.', {
        type: 'celebrate',
        withConfetti: true,
      });
    } catch (err) {
      console.error(err);
      showToast('Gagal Impor', 'Format berkas cadangan JSON tidak valid', 'error');
    }
  };

  // ==========================================
  // NEONDB DATABASE PULL & PUSH
  // ==========================================
  const handleFetchFromDb = async () => {
    try {
      setIsPullingFromDb(true);
      const data = await fetchAllData();
      if (data.config) setConfig(data.config);
      setMembers(data.members || []);
      setEvents(data.events || []);
      setAttendanceRecords(data.attendanceRecords || []);
      setTransactions(data.transactions || []);
      setDuesRecords(data.duesRecords || []);
      setBudgetPlans(data.budgetPlans || []);
      setSekbidMembers(data.sekbidMembers || []);
      if (data.sekbidList?.length) setSekbidList(data.sekbidList);

      const now = new Date().toISOString();
      setLastSyncedAt(now);

      // Initial cloud loading is silent; only failures are shown to the user.
    } catch (err: any) {
      console.warn('Fetch from NeonDB failed:', err);
      showToast('Gagal Memuat Data', err.message || 'Gagal terhubung ke NeonDB', 'error');
    } finally {
      setIsPullingFromDb(false);
    }
  };

  // NeonDB is the single source of truth. Load it once when the app opens.
  useEffect(() => {
    void handleFetchFromDb();
  }, []);

  const handleSyncToDb = async () => {
    try {
      setIsPushingToDb(true);
      await syncAllToDb({
        config,
        members,
        events,
        attendanceRecords,
        transactions,
        duesRecords,
        budgetPlans,
        sekbidMembers,
        sekbidList,
      });

      const now = new Date().toISOString();
      setLastSyncedAt(now);

      triggerActionFeedback(
        'Database NeonDB Berhasil Disinkronkan!',
        'Seluruh tabel (Config, Anggota, Absensi, Kas, Iuran, RAB) telah diperbarui di NeonDB Cloud.',
        {
          type: 'celebrate',
          badge: 'NeonDB Sync',
          withConfetti: true,
        }
      );
    } catch (err: any) {
      console.error('Sync to NeonDB failed:', err);
      showToast('Gagal Sinkronisasi', err.message || 'Gagal mengirim data ke NeonDB', 'error');
    } finally {
      setIsPushingToDb(false);
    }
  };

  const handleClearAllMembers = () => {
    setMembers([]);
    setDuesRecords([]);
    Promise.all([bulkSaveMembers([]), bulkSaveDues([])]).catch(err => console.warn('NeonDB clear members failed:', err));
    showToast('Data Anggota Dikosongkan', 'Seluruh biodata anggota dan catatan iuran telah dibersihkan.', 'info');
  };

  const handleClearAllFinance = () => {
    setTransactions([]);
    setDuesRecords([]);
    Promise.all([bulkSaveTransactions([]), bulkSaveDues([])]).catch(err => console.warn('NeonDB clear finance failed:', err));
    showToast('Data Buku Kas Dikosongkan', 'Seluruh transaksi kas dan catatan iuran dibersihkan. Saldo kembali ke Rp 0.', 'info');
  };

  const handleClearAllAttendance = () => {
    setEvents([]);
    setAttendanceRecords([]);
    Promise.all([bulkSaveEvents([]), bulkSaveAttendance([])]).catch(err => console.warn('NeonDB clear attendance failed:', err));
    showToast('Riwayat Presensi Dikosongkan', 'Seluruh sesi kegiatan dan riwayat presensi telah dibersihkan.', 'info');
  };

  const handleClearAllBudget = () => {
    setBudgetPlans([]);
    bulkSaveBudget([]).catch(err => console.warn('NeonDB clear budget failed:', err));
    showToast('Perancangan RAB Dikosongkan', 'Seluruh rencana anggaran belanja telah dibersihkan.', 'info');
  };

  const handleResetDemoData = () => {
    setConfig(initialOrganizationConfig);
    setMembers([]);
    setEvents([]);
    setAttendanceRecords([]);
    setTransactions([]);
    setDuesRecords([]);
    setBudgetPlans([]);
    setSekbidMembers([]);
    setSekbidList(initialSekbidList);
    Promise.all([
      saveConfig(initialOrganizationConfig),
      bulkSaveMembers([]),
      bulkSaveEvents([]),
      bulkSaveAttendance([]),
      bulkSaveTransactions([]),
      bulkSaveDues([]),
      bulkSaveBudget([]),
      bulkSaveSekbidMembers([]),
      saveSekbidDetails(initialSekbidList),
    ]).catch(err => console.warn('NeonDB total reset failed:', err));
    showToast('Database Total Direset', 'Semua data telah dikosongkan. Aplikasi bersih kembali.', 'info');
  };

  // Auth Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setGoogleAccessToken(null);
      setIsAuthModalOpen(false);
      showToast('Berhasil Keluar', 'Sesi login Anda telah diakhiri. Silakan masuk kembali.', 'info');
    } catch (e: any) {
      console.error(e);
      setCurrentUser(null);
      setGoogleAccessToken(null);
    }
  };

  // If user is not logged in / logged out -> Show dedicated Login Page directly
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-x-hidden">
        <LoginView
          config={config}
          onLoginSuccess={(user, token) => {
            setCurrentUser(user);
            if (token) setGoogleAccessToken(token);
          }}
          onTriggerFeedback={(title, message, type) => {
            triggerActionFeedback(title, message, {
              type: type || 'celebrate',
              withConfetti: true,
              badge: 'Portal Akun OSIS',
            });
          }}
        />
        {/* Modal Presensi Mandiri (dapat diakses anggota/siswa via scan QR tanpa perlu login admin) */}
        {isSelfCheckInOpen && (
          <SelfCheckInModal
            isOpen={isSelfCheckInOpen}
            onClose={() => setIsSelfCheckInOpen(false)}
            events={events}
            members={members}
            attendanceRecords={attendanceRecords}
            onRecordAttendance={handleRecordAttendance}
            config={config}
            initialSelectedEventId={presensiUrlEventId}
          />
        )}

        {/* Global Feedback Notifications & Toasts */}
        <FeedbackNotification
          toasts={toasts}
          onRemoveToast={removeToast}
          actionModal={actionModal}
          onCloseActionModal={() => setActionModal(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        onOpenSelfCheckIn={() => setIsSelfCheckInOpen(true)}
        onOpenQuickTransaction={() => {
          setQuickTransactionType('masuk');
          setIsQuickTransactionOpen(true);
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Content View Container (Adjusted for Left Sidebar & Fixed Top Header) */}
      <main className="flex-1 lg:pl-64 xl:pl-72 pt-20 sm:pt-22 pb-24 sm:pb-12 px-3 sm:px-6 lg:px-8 w-full transition-all">
        <ErrorBoundary>
        
        {activeTab === 'dashboard' && (
          <DashboardView
            config={config}
            members={members}
            events={events}
            attendanceRecords={attendanceRecords}
            transactions={transactions}
            duesRecords={duesRecords}
            setActiveTab={setActiveTab}
            onOpenSelfCheckIn={() => setIsSelfCheckInOpen(true)}
            onOpenQuickTransaction={() => {
              setQuickTransactionType('masuk');
              setIsQuickTransactionOpen(true);
            }}
            onViewReceipt={(tx) => {
              setReceiptModalData({
                isOpen: true,
                customDetails: {
                  receiptNumber: `TX-${tx.id.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
                  payerName: tx.recipientOrPayer,
                  description: `${tx.category} - ${tx.description}`,
                  amount: tx.amount,
                  date: tx.date,
                  paymentMethod: tx.type === 'masuk' ? 'Penerimaan Kas' : 'Pengeluaran Kas',
                },
              });
            }}
          />
        )}

        {activeTab === 'sekbid' && (
          <SekbidView
            sekbidList={sekbidList}
            members={sekbidMembers}
            config={config}
            onAddMember={handleAddSekbidMember}
            onUpdateMember={handleUpdateSekbidMember}
            onDeleteMember={handleDeleteSekbidMember}
            onUpdateSekbidDetail={handleUpdateSekbidDetail}
            onResetData={handleResetSekbidData}
            onSyncSheets={handleSyncToDb}
            isSyncing={isPushingToDb}
          />
        )}

        {activeTab === 'absensi' && (
          <AttendanceView
            events={events}
            records={attendanceRecords}
            members={members}
            config={config}
            onCreateEvent={handleCreateEvent}
            onUpdateRecordStatus={handleUpdateRecordStatus}
            onOpenSelfCheckIn={() => setIsSelfCheckInOpen(true)}
            onPrintReport={() => setActiveTab('laporan')}
          />
        )}

        {activeTab === 'keuangan' && (
          <FinanceView
            transactions={transactions}
            budgetPlans={budgetPlans}
            events={events}
            config={config}
            onOpenAddTransaction={(type) => {
              setQuickTransactionType(type || 'masuk');
              setIsQuickTransactionOpen(true);
            }}
            onViewReceipt={(tx) => {
              setReceiptModalData({
                isOpen: true,
                customDetails: {
                  receiptNumber: `TX-${tx.id.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
                  payerName: tx.recipientOrPayer,
                  description: `${tx.category} - ${tx.description}`,
                  amount: tx.amount,
                  date: tx.date,
                  paymentMethod: tx.type === 'masuk' ? 'Kas Masuk Organisasi' : 'Kas Keluar Organisasi',
                },
              });
            }}
            onPrintReport={() => setActiveTab('laporan')}
            onAddBudgetPlan={handleAddBudgetPlan}
          />
        )}

        {activeTab === 'iuran' && (
          <DuesView
            members={members}
            duesRecords={duesRecords}
            config={config}
            onPayDues={handlePayDues}
            onViewReceipt={(dueRecord, member) => {
              setReceiptModalData({
                isOpen: true,
                dueRecord,
                member,
              });
            }}
          />
        )}

        {activeTab === 'laporan' && (
          <ReportsView
            config={config}
            transactions={transactions}
            events={events}
            records={attendanceRecords}
            members={members}
            duesRecords={duesRecords}
            budgetPlans={budgetPlans}
          />
        )}

        {activeTab === 'anggota' && (
          <MembersView
            members={members}
            records={attendanceRecords}
            duesRecords={duesRecords}
            events={events}
            config={config}
            onAddMember={handleAddMember}
            onBulkAddMembers={handleBulkAddMembers}
            onBulkDeleteMembers={handleBulkDeleteMembers}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {activeTab === 'pengaturan' && (
          <SettingsView
            config={config}
            onUpdateConfig={(newConfig) => {
              setConfig(newConfig);
              saveConfig(newConfig).catch(err => console.warn('Save config error:', err));
              triggerActionFeedback('Pengaturan Disimpan!', 'Profil dan konfigurasi organisasi telah diperbarui di NeonDB.', {
                type: 'success',
                badge: 'Pengaturan',
              });
            }}
            onExportAllData={handleExportAllData}
            onImportData={handleImportData}
            onResetDemoData={handleResetDemoData}
            onClearMembers={handleClearAllMembers}
            onClearFinance={handleClearAllFinance}
            onClearAttendance={handleClearAllAttendance}
            onClearBudget={handleClearAllBudget}
            onSyncDb={handleSyncToDb}
            lastSyncedAt={lastSyncedAt}
          />
        )}

        {activeTab === 'updates' && (
          <UpdatesView
            updates={systemUpdates}
            onAddUpdate={handleAddSystemUpdate}
            onDeleteUpdate={handleDeleteSystemUpdate}
            isAdmin={true}
          />
        )}

        </ErrorBoundary>
      </main>

      {/* Footer (No-Print) */}
      <footer className="bg-white border-t border-slate-200 py-4 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {config.name} ({config.period}) • Sistem Informasi Absensi & Keuangan Organisasi (NeonDB PostgreSQL Cloud)</p>
        </div>
      </footer>

      {/* ========================================== */}
      {/* GLOBAL FEEDBACK NOTIFICATIONS & TOASTS */}
      {/* ========================================== */}
      <FeedbackNotification
        toasts={toasts}
        onRemoveToast={removeToast}
        actionModal={actionModal}
        onCloseActionModal={() => setActionModal(null)}
      />

      {/* ========================================== */}
      {/* AUTHENTICATION MODAL (EMAIL & PASSWORD) */}
      {/* ========================================== */}
      <AuthModal
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          if (token) setGoogleAccessToken(token);
        }}
        onTriggerFeedback={(title, message, type) => {
          triggerActionFeedback(title, message, {
            type: type || 'celebrate',
            withConfetti: true,
            badge: 'Autentikasi Akun',
          });
        }}
      />

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}

      <SelfCheckInModal
        isOpen={isSelfCheckInOpen}
        onClose={() => setIsSelfCheckInOpen(false)}
        events={events}
        members={members}
        attendanceRecords={attendanceRecords}
        onRecordAttendance={handleRecordAttendance}
        config={config}
        initialSelectedEventId={presensiUrlEventId}
      />

      <QuickTransactionModal
        isOpen={isQuickTransactionOpen}
        onClose={() => setIsQuickTransactionOpen(false)}
        onSave={handleSaveTransaction}
        events={events}
        defaultType={quickTransactionType}
      />

      <ReceiptModal
        isOpen={receiptModalData.isOpen}
        onClose={() => setReceiptModalData({ isOpen: false })}
        dueRecord={receiptModalData.dueRecord}
        member={receiptModalData.member}
        config={config}
        customDetails={receiptModalData.customDetails}
      />

    </div>
  );
}
