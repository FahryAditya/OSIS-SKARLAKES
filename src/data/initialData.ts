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
  name: 'Organisasi Siswa Intra Sekolah (OSIS)',
  shortName: 'OSIS',
  tagline: 'Maju Bersama, Berprestasi, dan Berakhlak Mulia',
  period: '2026 / 2027',
  institution: 'SMA / SMK Negeri',
  leaderName: 'Ketua Umum OSIS',
  secretaryName: 'Sekretaris Umum',
  treasurerName: 'Bendahara Umum',
  defaultMonthlyDue: 10000, // Rp 10.000 / bulan
  bankName: 'Bank Mandiri / QRIS Kas OSIS',
  bankAccountNumber: '',
  bankAccountHolder: 'BENDAHARA OSIS',
  logoUrl: '',
  address: 'Ruang Sekretariat OSIS & MPK',
  contactEmail: 'osis.official@sekolah.sch.id',
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
