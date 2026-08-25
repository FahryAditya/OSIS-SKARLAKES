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
  SekbidMember
} from './types';
import { 
  initialOrganizationConfig, 
  initialMembers, 
  initialEvents, 
  initialAttendanceRecords, 
  initialTransactions, 
  generateInitialDues, 
  initialBudgetPlans 
} from './data/initialData';
import { initialSekbidList, initialSekbidMembers } from './data/sekbidData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SekbidView } from './components/SekbidView';
import { AttendanceView } from './components/AttendanceView';
import { FinanceView } from './components/FinanceView';
import { DuesView } from './components/DuesView';
import { ReportsView } from './components/ReportsView';
import { MembersView } from './components/MembersView';
import { SettingsView } from './components/SettingsView';
import { SelfCheckInModal } from './components/SelfCheckInModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AuthModal } from './components/AuthModal';
import { LoginView } from './components/LoginView';
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
  syncAllToDb 
} from './services/dbService';
import { User } from 'firebase/auth';
import { formatRupiah } from './utils/formatters';
import { RefreshCw, UploadCloud, Database } from 'lucide-react';

const STORAGE_KEYS = {
  CONFIG: 'org_app_config_v1',
  MEMBERS: 'org_app_members_v1',
  SEKBID_LIST: 'org_app_sekbid_list_v1',
  SEKBID_MEMBERS: 'org_app_sekbid_members_v1',
  EVENTS: 'org_app_events_v1',
  ATTENDANCE: 'org_app_attendance_v1',
  TRANSACTIONS: 'org_app_transactions_v1',
  DUES: 'org_app_dues_v1',
  BUDGET: 'org_app_budget_v1',
  CONNECTED_SHEET: 'org_app_connected_sheet_v1',
  LAST_SYNCED: 'org_app_last_synced_v1',
  AUTO_SYNC: 'org_app_autosync_v1',
  GAS_URL: 'org_app_gas_url_v1',
  DB_VERSION: 'org_app_pure_db_v2',
};

// Automatic cleanup of legacy demo data on load
function checkAndCleanLegacyDummyData() {
  const version = localStorage.getItem(STORAGE_KEYS.DB_VERSION);
  if (version !== 'v2_pure_sheets') {
    const rawMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (rawMembers && (rawMembers.includes('m-01') || rawMembers.includes('Fahry') || rawMembers.includes('HIMA-IF'))) {
      localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    }
    const rawSekbidMembers = localStorage.getItem(STORAGE_KEYS.SEKBID_MEMBERS);
    if (rawSekbidMembers && rawSekbidMembers.includes('sm-01')) {
      localStorage.removeItem(STORAGE_KEYS.SEKBID_MEMBERS);
    }
    const rawEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (rawEvents && rawEvents.includes('evt-01')) {
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
    }
    const rawAtt = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (rawAtt && rawAtt.includes('att-1-1')) {
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    }
    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (rawTx && rawTx.includes('tx-')) {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    }
    const rawDues = localStorage.getItem(STORAGE_KEYS.DUES);
    if (rawDues && (rawDues.includes('due-m-01') || rawDues.includes('amount":20000'))) {
      localStorage.removeItem(STORAGE_KEYS.DUES);
    }
    const rawBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);
    if (rawBudget && rawBudget.includes('rab-01')) {
      localStorage.removeItem(STORAGE_KEYS.BUDGET);
    }
    const rawConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (rawConfig && (rawConfig.includes('HIMA-IF') || rawConfig.includes('Organisasi Siswa Intra Sekolah (OSIS)'))) {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
    }
    localStorage.setItem(STORAGE_KEYS.DB_VERSION, 'v3_skarlakes');
  }
}

checkAndCleanLegacyDummyData();

export default function App() {
  // ==========================================
  // State Initialization from LocalStorage
  // ==========================================
  const [config, setConfig] = useState<OrganizationConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.logoUrl || parsed.shortName === 'OSIS' || parsed.shortName === 'HIMA-IF') {
          parsed.logoUrl = initialOrganizationConfig.logoUrl;
          parsed.name = initialOrganizationConfig.name;
          parsed.shortName = initialOrganizationConfig.shortName;
          parsed.institution = initialOrganizationConfig.institution;
        }
        return parsed;
      } catch (e) {
        return initialOrganizationConfig;
      }
    }
    return initialOrganizationConfig;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove all legacy dummy/sample members (Kanaya, Halimatussadiyah, 2311001..2311040, 2026001..2026010, m-01..m-10)
          const filtered = parsed.filter(m => {
            if (!m || !m.nim) return false;
            const nim = String(m.nim);
            if (nim.startsWith('23110') || nim.startsWith('20260') || (m.id && m.id.startsWith('m-0')) || m.id === 'm-10') {
              return false;
            }
            return true;
          });
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
          return filtered;
        }
      } catch (e) {}
    }
    return [];
  });

  const [events, setEvents] = useState<AttendanceEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return initialEvents;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((r: AttendanceRecord) => {
            if (!r || !r.memberId) return false;
            const id = String(r.memberId);
            if (id.startsWith('m-0') || id === 'm-10' || id.includes('23110')) return false;
            return true;
          });
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(filtered));
          return filtered;
        }
      } catch (e) {}
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try {
        const parsed: Transaction[] = JSON.parse(saved);
        const filtered = parsed.filter(t => !t.id.startsWith('tx-'));
        return filtered;
      } catch (e) {
        return initialTransactions;
      }
    }
    return initialTransactions;
  });

  const [duesRecords, setDuesRecords] = useState<MonthlyDuesRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DUES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((d: MonthlyDuesRecord) => {
            if (!d || !d.memberId) return false;
            const id = String(d.memberId);
            if (id.startsWith('m-0') || id === 'm-10' || id.includes('23110')) return false;
            return true;
          });
          localStorage.setItem(STORAGE_KEYS.DUES, JSON.stringify(filtered));
          return filtered;
        }
      } catch (e) {}
    }
    return [];
  });

  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return saved ? JSON.parse(saved) : initialBudgetPlans;
  });

  // 10 Sekbid OSIS State
  const [sekbidList, setSekbidList] = useState<SekbidDetail[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SEKBID_LIST);
    return saved ? JSON.parse(saved) : initialSekbidList;
  });

  const [sekbidMembers, setSekbidMembers] = useState<SekbidMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SEKBID_MEMBERS);
    return saved ? JSON.parse(saved) : initialSekbidMembers;
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentStoredSession());
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Google Sheets Database State
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNCED) || null;
  });

  const [isPullingFromDb, setIsPullingFromDb] = useState(false);
  const [isPushingToDb, setIsPushingToDb] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals State
  const [isSelfCheckInOpen, setIsSelfCheckInOpen] = useState(false);
  const [presensiUrlEventId, setPresensiUrlEventId] = useState<string | undefined>(undefined);
  const [isQuickTransactionOpen, setIsQuickTransactionOpen] = useState(false);
  const [quickTransactionType, setQuickTransactionType] = useState<TransactionType>('masuk');

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

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DUES, JSON.stringify(duesRecords));
  }, [duesRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budgetPlans));
  }, [budgetPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEKBID_LIST, JSON.stringify(sekbidList));
  }, [sekbidList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEKBID_MEMBERS, JSON.stringify(sekbidMembers));
  }, [sekbidMembers]);

  useEffect(() => {
    if (lastSyncedAt) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, lastSyncedAt);
    }
  }, [lastSyncedAt]);

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
    setAttendanceRecords(prev => {
      const existingIdx = prev.findIndex(r => r.eventId === eventId && r.memberId === memberId);
      if (!member) return prev;

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          status,
          notes: notes !== undefined ? notes : updated[existingIdx].notes,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        return updated;
      } else {
        const newRec: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          eventId,
          memberId,
          memberName: member.name,
          memberNim: member.nim,
          division: member.division,
          status,
          notes,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        return [...prev, newRec];
      }
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
      console.warn('NeonDB save transaction failed:', err);
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
    customLabel?: string
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const receiptNum = `KAS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const totalAmount = customAmount !== undefined && customAmount > 0 
      ? customAmount 
      : monthsToPay.length * (config.defaultMonthlyDue || 10000);

    const monthNames = monthsToPay.length > 0 
      ? monthsToPay.map(m => ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m - 1]).join(', ')
      : 'Mingguan';
    
    const label = customLabel || `Iuran Kas (${monthNames})`;

    // Update dues records
    setDuesRecords(prev => {
      const existing = [...prev];
      monthsToPay.forEach(m => {
        const idx = existing.findIndex(rec => rec.memberId === memberId && rec.year === 2026 && rec.month === m);
        if (idx >= 0) {
          existing[idx] = {
            ...existing[idx],
            status: 'lunas',
            amount: customAmount ? Math.round(customAmount / (monthsToPay.length || 1)) : existing[idx].amount,
            paymentDate: todayStr,
            paymentMethod,
            receiptNumber: receiptNum,
            notes: notes || label,
          };
        } else {
          existing.push({
            id: `due-${memberId}-2026-${m}-${Date.now()}`,
            memberId,
            year: 2026,
            month: m,
            amount: customAmount ? Math.round(customAmount / (monthsToPay.length || 1)) : config.defaultMonthlyDue,
            status: 'lunas',
            paymentDate: todayStr,
            paymentMethod,
            receiptNumber: receiptNum,
            notes: notes || label,
          });
        }
      });
      return existing;
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
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    showToast('Data Anggota Diperbarui', 'Perubahan biodata anggota berhasil disimpan', 'success', 'user');
  };

  const handleDeleteMember = (id: string) => {
    const member = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    setDuesRecords(prev => prev.filter(d => d.memberId !== id));
    setAttendanceRecords(prev => prev.filter(r => r.memberId !== id));
    showToast('Anggota Dihapus', `${member?.name || 'Anggota'} telah dihapus dari daftar.`, 'info');
  };

  const handleBulkDeleteMembers = (ids: string[], reasonTitle?: string) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setMembers(prev => prev.filter(m => !idSet.has(m.id)));
    setDuesRecords(prev => prev.filter(d => !idSet.has(d.memberId)));
    setAttendanceRecords(prev => prev.filter(r => !idSet.has(r.memberId)));
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
    showToast('Pengurus Sekbid Ditambahkan', `${newMember.name} ditambahkan ke Sekbid ${newMember.sekbidId}`, 'success');
  };

  const handleUpdateSekbidMember = (id: string, updated: Partial<SekbidMember>) => {
    setSekbidMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    showToast('Data Pengurus Sekbid Diperbarui', 'Perubahan anggota sekbid tersimpan', 'success');
  };

  const handleDeleteSekbidMember = (id: string) => {
    setSekbidMembers(prev => prev.filter(m => m.id !== id));
    showToast('Pengurus Sekbid Dihapus', 'Data anggota sekbid dihapus', 'info');
  };

  const handleUpdateSekbidDetail = (id: number, updated: Partial<SekbidDetail>) => {
    setSekbidList(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    showToast('Program Kerja Sekbid Diperbarui', `Informasi Sekbid ${id} berhasil diperbarui`, 'success');
  };

  const handleResetSekbidData = () => {
    setSekbidList(initialSekbidList);
    setSekbidMembers(initialSekbidMembers);
    localStorage.removeItem(STORAGE_KEYS.SEKBID_LIST);
    localStorage.removeItem(STORAGE_KEYS.SEKBID_MEMBERS);
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
      if (data.members && data.members.length > 0) setMembers(data.members);
      if (data.events && data.events.length > 0) setEvents(data.events);
      if (data.attendanceRecords && data.attendanceRecords.length > 0) setAttendanceRecords(data.attendanceRecords);
      if (data.transactions && data.transactions.length > 0) setTransactions(data.transactions);
      if (data.duesRecords && data.duesRecords.length > 0) setDuesRecords(data.duesRecords);
      if (data.budgetPlans && data.budgetPlans.length > 0) setBudgetPlans(data.budgetPlans);
      if (data.sekbidMembers && data.sekbidMembers.length > 0) setSekbidMembers(data.sekbidMembers);

      const now = new Date().toISOString();
      setLastSyncedAt(now);

      triggerActionFeedback(
        'Data Termutakhir NeonDB Dimuat!',
        'Berhasil memuat seluruh data dari NeonDB PostgreSQL Cloud.',
        {
          type: 'sync',
          badge: 'NeonDB Cloud',
          withConfetti: true,
        }
      );
    } catch (err: any) {
      console.warn('Fetch from NeonDB failed:', err);
      showToast('Gagal Memuat Data', err.message || 'Gagal terhubung ke NeonDB', 'error');
    } finally {
      setIsPullingFromDb(false);
    }
  };

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
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.DUES);
    showToast('Data Anggota Dikosongkan', 'Seluruh biodata anggota dan catatan iuran telah dibersihkan.', 'info');
  };

  const handleClearAllFinance = () => {
    setTransactions([]);
    setDuesRecords([]);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.DUES);
    showToast('Data Buku Kas Dikosongkan', 'Seluruh transaksi kas dan catatan iuran dibersihkan. Saldo kembali ke Rp 0.', 'info');
  };

  const handleClearAllAttendance = () => {
    setEvents([]);
    setAttendanceRecords([]);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    showToast('Riwayat Presensi Dikosongkan', 'Seluruh sesi kegiatan dan riwayat presensi telah dibersihkan.', 'info');
  };

  const handleClearAllBudget = () => {
    setBudgetPlans([]);
    localStorage.removeItem(STORAGE_KEYS.BUDGET);
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
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.DB_VERSION, 'v3_skarlakes');
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

        {/* Modal Presensi Mandiri (dapat diakses anggota via scan QR tanpa perlu login admin) */}
        {isSelfCheckInOpen && (
          <SelfCheckInModal
            isOpen={isSelfCheckInOpen}
            onClose={() => setIsSelfCheckInOpen(false)}
            events={events}
            members={members}
            initialEventId={presensiUrlEventId}
            onCheckIn={(record) => {
              setAttendanceRecords(prev => [record, ...prev]);
            }}
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

      {/* NeonDB Database Quick Control Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-b border-emerald-500/20 py-2.5 px-4 sm:px-6 lg:px-8 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 text-xs">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="font-bold text-emerald-300">Database NeonDB Cloud (PostgreSQL) Aktif:</span>
              <span className="text-slate-300 font-mono text-2xs bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                ep-dark-mouse-azmzhuxs.c-3.ap-southeast-1.aws.neon.tech
              </span>
              {lastSyncedAt && (
                <span className="text-2xs text-slate-400">
                  (Disinkronkan: {new Date(lastSyncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              id="btn-quick-pull-db"
              onClick={handleFetchFromDb}
              disabled={isPullingFromDb}
              className="inline-flex items-center px-2.5 py-1 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/40 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-2xs"
              title="Tarik data terbaru dari NeonDB Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPullingFromDb ? 'animate-spin text-emerald-300' : ''}`} />
              <span>{isPullingFromDb ? 'Memuat Data...' : 'Muat Data DB'}</span>
            </button>

            <button
              type="button"
              id="btn-quick-push-db"
              onClick={handleSyncToDb}
              disabled={isPushingToDb}
              className="inline-flex items-center px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-2xs"
              title="Kirim dan sinkronkan semua perubahan ke NeonDB Cloud"
            >
              <UploadCloud className={`w-3.5 h-3.5 mr-1.5 ${isPushingToDb ? 'animate-bounce text-slate-950' : ''}`} />
              <span>{isPushingToDb ? 'Menyimpan...' : 'Sinkronkan DB'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main App Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-12">
        
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
            onUpdateSekbid={handleUpdateSekbidDetail}
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
        isOpen={isAuthModalOpen}
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
