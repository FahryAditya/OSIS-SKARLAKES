/**
 * Database Service - Frontend API layer
 * Replaces localStorage reads/writes with backend API calls to NeonDB
 */

import type {
  OrganizationConfig,
  Member,
  AttendanceEvent,
  AttendanceRecord,
  Transaction,
  MonthlyDuesRecord,
  BudgetPlan,
  SekbidMember,
  SekbidDetail,
} from '../types';

export interface AllAppData {
  config: OrganizationConfig | null;
  members: Member[];
  events: AttendanceEvent[];
  attendanceRecords: AttendanceRecord[];
  transactions: Transaction[];
  duesRecords: MonthlyDuesRecord[];
  budgetPlans: BudgetPlan[];
  sekbidMembers: SekbidMember[];
  sekbidList: SekbidDetail[] | null;
}

const API_BASE = '/api/db';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Koneksi ke server NeonDB terputus (Timeout 30 detik). Silakan coba lagi.');
    }
    throw new Error('Server API NeonDB tidak dapat dihubungi. Pastikan server backend dev berjalan.');
  } finally {
    window.clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const parsed = JSON.parse(body);
      message = parsed.error || parsed.message || body;
    } catch {
      /* Response bukan format JSON */
    }
    throw new Error(message || `Permintaan gagal (Status HTTP ${res.status})`);
  }

  return res.json();
}


// ============================================================
// FETCH ALL DATA
// ============================================================

/** Fetch all app data from NeonDB */
export async function fetchAllData(): Promise<AllAppData> {
  return apiFetch<AllAppData>('/data');
}

// ============================================================
// CONFIG
// ============================================================

export async function saveConfig(config: OrganizationConfig): Promise<void> {
  await apiFetch('/config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// ============================================================
// MEMBERS
// ============================================================

export async function saveMember(member: Member): Promise<void> {
  await apiFetch('/members', {
    method: 'POST',
    body: JSON.stringify(member),
  });
}

export async function deleteMember(id: string): Promise<void> {
  await apiFetch(`/members/${id}`, { method: 'DELETE' });
}

export async function bulkSaveMembers(members: Member[]): Promise<void> {
  await apiFetch('/members/bulk', {
    method: 'POST',
    body: JSON.stringify({ members }),
  });
}

// ============================================================
// EVENTS
// ============================================================

export async function saveEvent(event: AttendanceEvent): Promise<void> {
  await apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await apiFetch(`/events/${id}`, { method: 'DELETE' });
}

export async function bulkSaveEvents(events: AttendanceEvent[]): Promise<void> {
  await apiFetch('/events/bulk', {
    method: 'POST',
    body: JSON.stringify({ events }),
  });
}

// ============================================================
// ATTENDANCE
// ============================================================

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
  await apiFetch('/attendance', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  await apiFetch(`/attendance/${id}`, { method: 'DELETE' });
}

export async function bulkSaveAttendance(records: AttendanceRecord[]): Promise<void> {
  await apiFetch('/attendance/bulk', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

// ============================================================
// TRANSACTIONS
// ============================================================

export async function saveTransaction(tx: Transaction): Promise<void> {
  await apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(tx),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

export async function bulkSaveTransactions(transactions: Transaction[]): Promise<void> {
  await apiFetch('/transactions/bulk', {
    method: 'POST',
    body: JSON.stringify({ transactions }),
  });
}

// ============================================================
// DUES RECORDS
// ============================================================

export async function saveDuesRecord(record: MonthlyDuesRecord): Promise<void> {
  await apiFetch('/dues', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function deleteDuesRecord(id: string): Promise<void> {
  await apiFetch(`/dues/${id}`, { method: 'DELETE' });
}

export async function bulkSaveDues(records: MonthlyDuesRecord[]): Promise<void> {
  await apiFetch('/dues/bulk', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

// ============================================================
// BUDGET PLANS
// ============================================================

export async function saveBudgetPlan(plan: BudgetPlan): Promise<void> {
  await apiFetch('/budget', {
    method: 'POST',
    body: JSON.stringify(plan),
  });
}

export async function deleteBudgetPlan(id: string): Promise<void> {
  await apiFetch(`/budget/${id}`, { method: 'DELETE' });
}

export async function bulkSaveBudget(plans: BudgetPlan[]): Promise<void> {
  await apiFetch('/budget/bulk', {
    method: 'POST',
    body: JSON.stringify({ plans }),
  });
}

// ============================================================
// SEKBID MEMBERS
// ============================================================

export async function saveSekbidMember(member: SekbidMember): Promise<void> {
  await apiFetch('/sekbid-members', {
    method: 'POST',
    body: JSON.stringify(member),
  });
}

export async function deleteSekbidMember(id: string): Promise<void> {
  await apiFetch(`/sekbid-members/${id}`, { method: 'DELETE' });
}

export async function bulkSaveSekbidMembers(members: SekbidMember[]): Promise<void> {
  await apiFetch('/sekbid-members/bulk', {
    method: 'POST',
    body: JSON.stringify({ members }),
  });
}

export async function saveSekbidDetails(sekbidList: SekbidDetail[]): Promise<void> {
  await apiFetch('/sekbid-details', {
    method: 'POST',
    body: JSON.stringify({ sekbidList }),
  });
}

// ============================================================
// FULL SYNC (upload all local data to DB in one shot)
// ============================================================

export async function syncAllToDb(data: {
  config: OrganizationConfig;
  members: Member[];
  events: AttendanceEvent[];
  attendanceRecords: AttendanceRecord[];
  transactions: Transaction[];
  duesRecords: MonthlyDuesRecord[];
  budgetPlans: BudgetPlan[];
  sekbidMembers: SekbidMember[];
  sekbidList: SekbidDetail[];
}): Promise<void> {
  await apiFetch('/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
