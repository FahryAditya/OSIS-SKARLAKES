import React, { useState, useEffect } from 'react';
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
import { initAuth, logoutGoogle } from './services/googleAuth';
import { 
  SpreadsheetInfo, 
  SpreadsheetDataPayload, 
  appendTransactionToSheet, 
  appendAttendanceToSheet 
} from './services/googleSheetsService';
import { User } from 'firebase/auth';

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
};

export default function App() {
  // State Initialization from LocalStorage or Defaults
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

  // Google Sheets Database State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  const [connectedSpreadsheet, setConnectedSpreadsheet] = useState<SpreadsheetInfo | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONNECTED_SHEET);
    return saved ? JSON.parse(saved) : null;
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNCED) || null;
  });

  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
    return saved !== null ? JSON.parse(saved) : true;
  });

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

  // Init Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
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

  // Attendance Handlers
  const handleRecordAttendance = (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setAttendanceRecords(prev => [...prev, newRecord]);

    // Auto-sync single record to Google Sheets if connected
    if (isAutoSyncEnabled && googleAccessToken && connectedSpreadsheet) {
      appendAttendanceToSheet(googleAccessToken, connectedSpreadsheet.id, newRecord).catch(err => {
        console.warn('Auto-sync attendance to Google Sheets failed:', err);
      });
    }
  };

  const handleUpdateRecordStatus = (eventId: string, memberId: string, status: AttendanceStatus, notes?: string) => {
    setAttendanceRecords(prev => {
      const existingIdx = prev.findIndex(r => r.eventId === eventId && r.memberId === memberId);
      const member = members.find(m => m.id === memberId);
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
  };

  const handleCreateEvent = (eventData: Omit<AttendanceEvent, 'id' | 'qrCodeToken'>) => {
    const newEvent: AttendanceEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      qrCodeToken: `${config.shortName}-${Date.now().toString(36).toUpperCase()}`,
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  // Transaction Handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Auto-sync single transaction to Google Sheets if connected
    if (isAutoSyncEnabled && googleAccessToken && connectedSpreadsheet) {
      appendTransactionToSheet(googleAccessToken, connectedSpreadsheet.id, newTx).catch(err => {
        console.warn('Auto-sync transaction to Google Sheets failed:', err);
      });
    }
  };

  // Dues Handlers
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

  // Member Handlers
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
  };

  const handleUpdateMember = (id: string, updated: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // Budget Handler
  const handleAddBudgetPlan = (plan: Omit<BudgetPlan, 'id'>) => {
    const newPlan: BudgetPlan = {
      ...plan,
      id: `rab-${Date.now()}`,
    };
    setBudgetPlans(prev => [...prev, newPlan]);
  };

  // Export / Import / Reset
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
    } catch (err) {
      console.error(err);
      alert('Format JSON tidak sesuai!');
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
  };

  const handleResetDemoData = () => {
    setConfig(initialOrganizationConfig);
    setMembers(initialMembers);
    setEvents(initialEvents);
    setAttendanceRecords(initialAttendanceRecords);
    setTransactions(initialTransactions);
    setDuesRecords(generateInitialDues(initialMembers));
    setBudgetPlans(initialBudgetPlans);
    localStorage.clear();
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
        isGoogleSignedIn={Boolean(googleUser && googleAccessToken)}
      />

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
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {activeTab === 'pengaturan' && (
          <SettingsView
            config={config}
            onUpdateConfig={setConfig}
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

      {/* MODALS */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        currentUser={googleUser}
        accessToken={googleAccessToken}
        connectedSpreadsheet={connectedSpreadsheet}
        lastSyncedAt={lastSyncedAt}
        isAutoSyncEnabled={isAutoSyncEnabled}
        onToggleAutoSync={setIsAutoSyncEnabled}
        onSpreadsheetConnected={(info) => {
          setConnectedSpreadsheet(info);
          setLastSyncedAt(new Date().toISOString());
        }}
        onSpreadsheetDisconnected={() => {
          setConnectedSpreadsheet(null);
          setLastSyncedAt(null);
        }}
        onAuthSuccess={(user, token) => {
          setGoogleUser(user);
          setGoogleAccessToken(token);
        }}
        onAuthLogout={() => {
          setGoogleUser(null);
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
