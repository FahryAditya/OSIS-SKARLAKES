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
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
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
  SpreadsheetInfo, 
  SpreadsheetDataPayload, 
  appendTransactionToSheet, 
  appendAttendanceToSheet,
  DEFAULT_APPS_SCRIPT_URL,
  syncViaAppsScript,
  fetchViaAppsScript,
  syncAllToSpreadsheet,
  fetchDataFromSpreadsheet
} from './services/googleSheetsService';
import { User } from 'firebase/auth';
import { formatRupiah } from './utils/formatters';
import { RefreshCw, UploadCloud, FileSpreadsheet } from 'lucide-react';

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
    if (rawConfig && rawConfig.includes('HIMA-IF')) {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
    }
    localStorage.setItem(STORAGE_KEYS.DB_VERSION, 'v2_pure_sheets');
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
        if (!parsed.logoUrl) {
          parsed.logoUrl = initialOrganizationConfig.logoUrl;
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
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [events, setEvents] = useState<AttendanceEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : initialEvents;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : initialAttendanceRecords;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try {
        const parsed: Transaction[] = JSON.parse(saved);
        // Filter out initial demo transactions so Saldo Kas starts clean at 0
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
    return saved ? JSON.parse(saved) : generateInitialDues(initialMembers);
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
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  const [connectedSpreadsheet, setConnectedSpreadsheet] = useState<SpreadsheetInfo | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONNECTED_SHEET);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    const gasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) || DEFAULT_APPS_SCRIPT_URL;
    return {
      id: 'apps-script-connected',
      title: 'Google Spreadsheet OSIS (Cloud DB)',
      url: gasUrl,
      sheets: ['Info_Organisasi', 'Data_Anggota', 'Kegiatan_Presensi', 'Rekap_Presensi', 'Buku_Kas_Keuangan', 'Iuran_Kas_Bulanan', 'RAB_Anggaran'],
      lastSynced: undefined,
    };
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNCED) || null;
  });

  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isPullingFromSheets, setIsPullingFromSheets] = useState(false);
  const [isPushingToSheets, setIsPushingToSheets] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals State
  const [isSelfCheckInOpen, setIsSelfCheckInOpen] = useState(false);
  const [isQuickTransactionOpen, setIsQuickTransactionOpen] = useState(false);
  const [quickTransactionType, setQuickTransactionType] = useState<TransactionType>('masuk');
  
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
    if (connectedSpreadsheet) {
      localStorage.setItem(STORAGE_KEYS.CONNECTED_SHEET, JSON.stringify(connectedSpreadsheet));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CONNECTED_SHEET);
    }
  }, [connectedSpreadsheet]);

  useEffect(() => {
    if (lastSyncedAt) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, lastSyncedAt);
    }
  }, [lastSyncedAt]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, JSON.stringify(isAutoSyncEnabled));
  }, [isAutoSyncEnabled]);

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

    // Auto-sync single record to Google Sheets if connected
    if (isAutoSyncEnabled && googleAccessToken && connectedSpreadsheet) {
      appendAttendanceToSheet(googleAccessToken, connectedSpreadsheet.id, newRecord).catch(err => {
        console.warn('Auto-sync attendance to Google Sheets failed:', err);
      });
    }
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

    // Auto-sync single transaction to Google Sheets if connected
    if (isAutoSyncEnabled && googleAccessToken && connectedSpreadsheet) {
      appendTransactionToSheet(googleAccessToken, connectedSpreadsheet.id, newTx).catch(err => {
        console.warn('Auto-sync transaction to Google Sheets failed:', err);
      });
    }
  };

  // ==========================================
  // Dues Handlers with Feedback
  // ==========================================
  const handlePayDues = (
    memberId: string, 
    monthsToPay: number[], 
    paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet', 
    notes?: string
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const receiptNum = `KAS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Update dues records
    setDuesRecords(prev => {
      return prev.map(rec => {
        if (rec.memberId === memberId && rec.year === 2026 && monthsToPay.includes(rec.month)) {
          return {
            ...rec,
            status: 'lunas',
            paymentDate: todayStr,
            paymentMethod,
            receiptNumber: receiptNum,
            notes: notes || 'Pembayaran iuran kas',
          };
        }
        return rec;
      });
    });

    // Also auto-record into General Ledger (Buku Kas Masuk)
    const totalAmount = monthsToPay.length * config.defaultMonthlyDue;
    const monthNames = monthsToPay.map(m => ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m - 1]).join(', ');
    
    handleSaveTransaction({
      type: 'masuk',
      category: 'Iuran Kas Anggota',
      amount: totalAmount,
      date: todayStr,
      description: `Iuran Kas (${monthNames}) a.n ${member.name}`,
      recipientOrPayer: member.name,
      recordedBy: config.treasurerName || 'Bendahara',
    });

    // Action feedback
    triggerActionFeedback(
      'Pembayaran Iuran Berhasil!',
      `${member.name} lunas iuran (${monthNames}) total ${formatRupiah(totalAmount)}`,
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
        description: `Pembayaran Iuran Kas Bulanan (${monthNames} 2026)`,
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

  const handleApplyImportedFromSheets = (data: Partial<SpreadsheetDataPayload>) => {
    if (data.config) setConfig(data.config);
    if (data.members && data.members.length > 0) setMembers(data.members);
    if (data.events && data.events.length > 0) setEvents(data.events);
    if (data.attendanceRecords && data.attendanceRecords.length > 0) setAttendanceRecords(data.attendanceRecords);
    if (data.transactions && data.transactions.length > 0) setTransactions(data.transactions);
    if (data.duesRecords && data.duesRecords.length > 0) setDuesRecords(data.duesRecords);
    if (data.budgetPlans && data.budgetPlans.length > 0) setBudgetPlans(data.budgetPlans);
    setLastSyncedAt(new Date().toISOString());

    triggerActionFeedback(
      'Data Google Sheets Dimuat!',
      'Seluruh 7 lembar kerja Google Sheets berhasil disinkronkan ke aplikasi.',
      {
        type: 'sync',
        iconType: 'sheet',
        badge: 'Cloud Sync',
        withConfetti: true,
      }
    );
  };

  // Google Sheets Current Payload
  const currentDataPayload: SpreadsheetDataPayload = {
    config,
    members,
    events,
    attendanceRecords,
    transactions,
    duesRecords,
    budgetPlans,
  };

  // ==========================================
  // PURE GOOGLE SHEETS DATABASE PULL & PUSH
  // ==========================================
  const handlePullFromSheets = async (isAuto = false) => {
    const gasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) || DEFAULT_APPS_SCRIPT_URL;

    try {
      setIsPullingFromSheets(true);

      let imported: Partial<SpreadsheetDataPayload> = {};

      if (currentUser && googleAccessToken && connectedSpreadsheet && connectedSpreadsheet.id !== 'apps-script-connected') {
        // Pull via Google Sheets API (OAuth)
        imported = await fetchDataFromSpreadsheet(googleAccessToken, connectedSpreadsheet.id);
      } else if (gasUrl) {
        // Pull via Apps Script Webhook (No Login required)
        imported = await fetchViaAppsScript(gasUrl);
      }

      let loadedCount = 0;
      if (imported.config) setConfig(imported.config);
      if (imported.members && imported.members.length > 0) {
        setMembers(imported.members);
        loadedCount += imported.members.length;
      }
      if (imported.events && imported.events.length > 0) {
        setEvents(imported.events);
        loadedCount += imported.events.length;
      }
      if (imported.attendanceRecords && imported.attendanceRecords.length > 0) {
        setAttendanceRecords(imported.attendanceRecords);
        loadedCount += imported.attendanceRecords.length;
      }
      if (imported.transactions && imported.transactions.length > 0) {
        setTransactions(imported.transactions);
        loadedCount += imported.transactions.length;
      }
      if (imported.duesRecords && imported.duesRecords.length > 0) {
        setDuesRecords(imported.duesRecords);
        loadedCount += imported.duesRecords.length;
      }
      if (imported.budgetPlans && imported.budgetPlans.length > 0) {
        setBudgetPlans(imported.budgetPlans);
        loadedCount += imported.budgetPlans.length;
      }

      const now = new Date().toISOString();
      setLastSyncedAt(now);

      if (!isAuto) {
        triggerActionFeedback(
          'Data Google Sheets Termutakhir Dimuat!',
          loadedCount > 0 
            ? `Berhasil menarik ${loadedCount} data dari Google Spreadsheet.` 
            : 'Sinkronisasi berhasil (Spreadsheet dalam kondisi bersih/kosong).',
          {
            type: 'sync',
            iconType: 'sheet',
            badge: 'Tarik Cloud',
            withConfetti: true,
          }
        );
      } else {
        showToast('Sinkronisasi Otomatis', 'Data cloud Google Sheets siap digunakan', 'success', 'sheet');
      }
    } catch (err: any) {
      console.warn('Pull from sheets failed:', err);
      if (!isAuto) {
        showToast('Gagal Menarik Data', err.message || 'Periksa koneksi Google Spreadsheet / Apps Script', 'error');
      }
    } finally {
      setIsPullingFromSheets(false);
    }
  };

  const handlePushToSheets = async () => {
    const gasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) || DEFAULT_APPS_SCRIPT_URL;

    try {
      setIsPushingToSheets(true);

      if (currentUser && googleAccessToken && connectedSpreadsheet && connectedSpreadsheet.id !== 'apps-script-connected') {
        // Push via Google Sheets API (OAuth)
        await syncAllToSpreadsheet(googleAccessToken, connectedSpreadsheet.id, currentDataPayload);
      } else if (gasUrl) {
        // Push via Apps Script Webhook
        await syncViaAppsScript(gasUrl, currentDataPayload);
      }

      const now = new Date().toISOString();
      setLastSyncedAt(now);

      triggerActionFeedback(
        'Database Google Sheets Berhasil Disinkronkan!',
        'Seluruh lembar kerja (Info, Anggota, Absensi, Kas, Iuran, RAB) telah diperbarui di Google Spreadsheet.',
        {
          type: 'celebrate',
          iconType: 'sheet',
          badge: 'Sinkronisasi Penuh',
          withConfetti: true,
        }
      );
    } catch (err: any) {
      console.error('Push to sheets failed:', err);
      showToast('Gagal Sinkronisasi', err.message || 'Gagal mengirim data ke Google Spreadsheet', 'error');
    } finally {
      setIsPushingToSheets(false);
    }
  };

  // Initial pull from Google Sheets on component mount
  const hasPulledOnMount = useRef(false);
  useEffect(() => {
    if (!hasPulledOnMount.current) {
      hasPulledOnMount.current = true;
      handlePullFromSheets(true);
    }
  }, []);

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
    localStorage.setItem(STORAGE_KEYS.DB_VERSION, 'v2_pure_sheets');
    showToast('Database Bersih Murni Aktif', 'Semua dummy data telah dibersihkan. Aplikasi siap menggunakan Google Sheets.', 'info');
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
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
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
        onOpenGoogleSheetsSync={() => setIsGoogleSheetsModalOpen(true)}
        isGoogleSheetsConnected={Boolean(connectedSpreadsheet)}
        isGoogleSignedIn={Boolean(currentUser && googleAccessToken)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Pure Google Sheets Database Quick Control Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-b border-emerald-500/20 py-2.5 px-4 sm:px-6 lg:px-8 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 text-xs">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="font-bold text-emerald-300">Database Google Sheets Murni Aktif:</span>
              <span className="text-slate-300 truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                {connectedSpreadsheet?.title || 'Spreadsheet Cloud OSIS'}
              </span>
              {lastSyncedAt && (
                <span className="text-2xs text-slate-400">
                  (Sinkron: {new Date(lastSyncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              id="btn-quick-pull-sheets"
              onClick={() => handlePullFromSheets(false)}
              disabled={isPullingFromSheets}
              className="inline-flex items-center px-2.5 py-1 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/40 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-2xs"
              title="Tarik data terbaru dari Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPullingFromSheets ? 'animate-spin text-emerald-300' : ''}`} />
              <span>{isPullingFromSheets ? 'Menarik Data...' : 'Tarik Data'}</span>
            </button>

            <button
              type="button"
              id="btn-quick-push-sheets"
              onClick={handlePushToSheets}
              disabled={isPushingToSheets}
              className="inline-flex items-center px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-2xs"
              title="Kirim dan sinkronkan semua perubahan ke Google Sheets"
            >
              <UploadCloud className={`w-3.5 h-3.5 mr-1.5 ${isPushingToSheets ? 'animate-bounce text-slate-950' : ''}`} />
              <span>{isPushingToSheets ? 'Menyimpan...' : 'Sinkronkan'}</span>
            </button>

            <button
              type="button"
              id="btn-quick-manage-sheets"
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="inline-flex items-center px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              title="Pengaturan Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main App Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
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
            onSyncSheets={handlePushToSheets}
            isSyncing={isPushingToSheets}
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
              triggerActionFeedback('Pengaturan Disimpan!', 'Profil dan konfigurasi organisasi telah diperbarui.', {
                type: 'success',
                badge: 'Pengaturan',
              });
            }}
            onExportAllData={handleExportAllData}
            onImportData={handleImportData}
            onResetDemoData={handleResetDemoData}
            onOpenGoogleSheetsSync={() => setIsGoogleSheetsModalOpen(true)}
            isGoogleSheetsConnected={Boolean(connectedSpreadsheet)}
            connectedSheetTitle={connectedSpreadsheet?.title}
            connectedSheetUrl={connectedSpreadsheet?.url}
            lastSyncedAt={lastSyncedAt}
          />
        )}

      </main>

      {/* Footer (No-Print) */}
      <footer className="bg-white border-t border-slate-200 py-4 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {config.name} ({config.period}) • Sistem Informasi Absensi & Keuangan Organisasi</p>
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
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        currentUser={currentUser}
        accessToken={googleAccessToken}
        connectedSpreadsheet={connectedSpreadsheet}
        lastSyncedAt={lastSyncedAt}
        isAutoSyncEnabled={isAutoSyncEnabled}
        onToggleAutoSync={setIsAutoSyncEnabled}
        onSpreadsheetConnected={(info) => {
          setConnectedSpreadsheet(info);
          setLastSyncedAt(new Date().toISOString());
          triggerActionFeedback(
            'Spreadsheet Terhubung & Disinkronkan!',
            `Data tersinkronkan ke: "${info.title}"`,
            {
              type: 'sync',
              iconType: 'sheet',
              badge: 'Google Sheets',
              withConfetti: true,
            }
          );
        }}
        onSpreadsheetDisconnected={() => {
          setConnectedSpreadsheet(null);
          setLastSyncedAt(null);
          showToast('Spreadsheet Terputus', 'Koneksi Google Sheets dinonaktifkan', 'info');
        }}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          setGoogleAccessToken(token);
        }}
        onAuthLogout={() => {
          setCurrentUser(null);
          setGoogleAccessToken(null);
        }}
        currentDataPayload={currentDataPayload}
        onApplyImportedData={handleApplyImportedFromSheets}
      />

      <SelfCheckInModal
        isOpen={isSelfCheckInOpen}
        onClose={() => setIsSelfCheckInOpen(false)}
        events={events}
        members={members}
        attendanceRecords={attendanceRecords}
        onRecordAttendance={handleRecordAttendance}
        config={config}
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
