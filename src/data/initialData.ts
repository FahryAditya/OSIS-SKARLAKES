import { 
  OrganizationConfig, 
  Member, 
  AttendanceEvent, 
  AttendanceRecord, 
  Transaction, 
  MonthlyDuesRecord, 
  BudgetPlan 
} from '../types';

export const initialOrganizationConfig: OrganizationConfig = {
  name: 'OSIS SKARLAKES (SMK Airlangga & SMK Kesehatan Airlangga)',
  shortName: 'OSIS SKARLAKES',
  tagline: 'Maju Bersama, Berprestasi, dan Berakhlak Mulia',
  period: '2026 / 2027',
  institution: 'SMK Airlangga & SMK Kesehatan Airlangga Balikpapan',
  leaderName: 'Ketua Umum OSIS',
  secretaryName: 'Sekretaris Umum',
  treasurerName: 'Bendahara Umum',
  defaultMonthlyDue: 10000, // Rp 10.000 / bulan
  defaultWeeklyDue: 2500, // Rp 2.500 / minggu
  duesMode: 'mingguan',
  duesStartMonth: 8,  // Mulai Agustus
  duesEndMonth: 7,    // Sampai Juli (tahun ajaran berikutnya)
  bankName: 'Bank Mandiri / QRIS Kas OSIS SKARLAKES',
  bankAccountNumber: '',
  bankAccountHolder: 'BENDAHARA OSIS SKARLAKES',
  logoUrl: '/logo.png',
  address: 'Ruang Sekretariat OSIS SKARLAKES',
  contactEmail: 'osis.skarlakes@gmail.com',
  contactPhone: '',
};

export const initialMembers: Member[] = [];

export const initialEvents: AttendanceEvent[] = [];

export const initialAttendanceRecords: AttendanceRecord[] = [];

export const initialTransactions: Transaction[] = [];

export const generateInitialDues = (members: Member[]): MonthlyDuesRecord[] => {
  const records: MonthlyDuesRecord[] = [];
  const currentYear = 2026;

  members.forEach((member) => {
    // Generate months 1 to 12 as unpaid for clean new members
    for (let month = 1; month <= 12; month++) {
      records.push({
        id: `due-${member.id}-${currentYear}-${month}`,
        memberId: member.id,
        year: currentYear,
        month,
        amount: 10000,
        status: 'belum',
      });
    }
  });

  return records;
};

export const initialBudgetPlans: BudgetPlan[] = [];
