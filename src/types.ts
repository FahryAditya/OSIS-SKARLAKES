export type Division = 
  | 'Badan Pengurus Harian (BPH)'
  | 'Sekbid 1 (Keimanan & Ketakwaan)'
  | 'Sekbid 2 (Budi Pekerti & Akhlak Mulia)'
  | 'Sekbid 3 (Bela Negara & Wawasan Kebangsaan)'
  | 'Sekbid 4 (Akademik, Seni & Olahraga)'
  | 'Sekbid 5 (Demokrasi & Lingkungan Hidup)'
  | 'Sekbid 6 (Kreativitas & Kewirausahaan)'
  | 'Sekbid 7 (Kesehatan Jasmani & Gizi)'
  | 'Sekbid 8 (Sastra & Budaya)'
  | 'Sekbid 9 (TIK & Publikasi Media)'
  | 'Sekbid 10 (Komunikasi Bahasa Asing)';

export type Role = 
  | 'Ketua Umum'
  | 'Wakil Ketua'
  | 'Sekretaris 1'
  | 'Sekretaris 2'
  | 'Bendahara 1'
  | 'Bendahara 2'
  | 'Koordinator Divisi'
  | 'Staf Ahli'
  | 'Anggota Aktif';

export interface Member {
  id: string;
  nim: string;
  name: string;
  kelas?: string;
  division: Division;
  role: Role;
  phone: string;
  email: string;
  avatarUrl?: string;
  joinDate: string;
  isActive: boolean;
}

export type EventType = 
  | 'Rapat Pleno'
  | 'Rapat Pengurus Harian'
  | 'Rapat Divisi'
  | 'Proker / Acara Utama'
  | 'Kumpul Rutin'
  | 'Workshop / Pelatihan';

export type EventStatus = 'upcoming' | 'active' | 'completed';

export interface AttendanceEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  locationType: 'offline' | 'online';
  qrCodeToken: string;
  status: EventStatus;
  notes?: string;
  divisionTarget: 'Semua Divisi' | Division;
  organizer: string;
}

export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';

export interface AttendanceRecord {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  memberNim: string;
  division: Division;
  status: AttendanceStatus;
  timestamp: string;
  notes?: string;
  proofUrl?: string;
}

export type TransactionType = 'masuk' | 'keluar';

export type TransactionCategory = 
  | 'Iuran Kas Anggota'
  | 'Sponsorship'
  | 'Dana Usaha (Danus)'
  | 'Hibah / Donasi Kampus'
  | 'Konsumsi Rapat / Acara'
  | 'Perlengkapan & Logistik'
  | 'Sewa Tempat & Sound System'
  | 'Publikasi, Banner & Medkraf'
  | 'Hadiah, Plakat & Sertifikat'
  | 'Transportasi & Operasional'
  | 'Lain-lain';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  recipientOrPayer: string;
  receiptProof?: string;
  recordedBy: string;
  relatedEventId?: string;
}

export type DuesStatus = 'lunas' | 'belum' | 'bebas';

export interface MonthlyDuesRecord {
  id: string;
  memberId: string;
  year: number;
  month: number; // 1-12
  week?: number; // 1-4 (for weekly mode)
  amount: number;
  status: DuesStatus;
  paymentDate?: string;
  paymentMethod?: 'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet';
  receiptNumber?: string;
  notes?: string;
}

export interface BudgetPlan {
  id: string;
  prokerName: string;
  division: Division;
  allocatedBudget: number;
  realizedBudget: number;
  date: string;
  status: 'Direncanakan' | 'Berjalan' | 'Selesai';
}

export interface OrganizationConfig {
  name: string;
  shortName: string;
  tagline: string;
  period: string; // e.g. "2026 / 2027"
  institution: string; // e.g. "Universitas / Fakultas / Daerah"
  leaderName: string;
  secretaryName: string;
  treasurerName: string;
  defaultMonthlyDue: number; // e.g. 10000 (Rp 10.000)
  defaultWeeklyDue?: number; // e.g. 2500 (Rp 2.500)
  duesMode?: 'bulanan' | 'mingguan';
  duesStartMonth?: number; // 1-12, default 8 (Agustus)
  duesEndMonth?: number;   // 1-12, default 7 (Juli tahun berikutnya)
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  qrisImageUrl?: string;
  logoUrl?: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

export type SekbidRole = 'Ketua Sekbid' | 'Wakil Ketua Sekbid' | 'Anggota';

export interface SekbidMember {
  id: string;
  sekbidId: number; // 1 to 10
  name: string;
  nis: string; // NIS / NISN
  role: SekbidRole;
  gradeClass: string; // e.g. "XI MIPA 1", "X-2", "XII IPS 1"
  phone: string;
  email?: string;
  avatarUrl?: string;
  status: 'Aktif' | 'Nonaktif';
  taskOrFocus?: string;
  joinedPeriod?: string;
}

export interface SekbidDetail {
  id: number; // 1-10
  number: number;
  code: string; // "SEKBID 1", etc.
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  prokerList: string[];
  themeColor: string;
}

export type UpdateCategory = 'UI/UX' | 'Fitur Baru' | 'Perbaikan Bug' | 'Database / Cloud' | 'Lainnya';

export interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  date: string;
  category: UpdateCategory;
  description: string;
  author: string;
  changesList: string[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'sekbid'
  | 'absensi'
  | 'keuangan'
  | 'iuran'
  | 'laporan'
  | 'anggota'
  | 'pengaturan'
  | 'updates';

