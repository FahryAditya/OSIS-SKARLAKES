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
  name: 'Himpunan Mahasiswa Informatika (HIMA-IF)',
  shortName: 'HIMA-IF',
  tagline: 'Kabinet Sinergi Karya 2026/2027',
  period: '2026 / 2027',
  institution: 'Fakultas Ilmu Komputer & Teknologi Informasi',
  leaderName: 'Fahry Aditya Setiawan',
  secretaryName: 'Annisa Putri Rahmadani',
  treasurerName: 'Nadia Salsabila Putri',
  defaultMonthlyDue: 20000, // Rp 20.000 / bulan
  bankName: 'Bank Mandiri',
  bankAccountNumber: '137-00-1928374-1',
  bankAccountHolder: 'HIMA IF BENDAHARA RESMI',
  logoUrl: 'https://scontent.cdninstagram.com/v/t51.2885-19/269302906_443819017140752_1385600717202454420_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=104&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=8749VSmRszkQ7kNvwFsmwKn&_nc_oc=AdoZstS6DLVYpo1YiqIrSYozGT_N8fcxrmKBnZgVRCHWqwdnXghh3Q1rfnQ9p1eP6Vs&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_ss=7aa8c&oh=00_AQHOfZCImKxtOtUEpSNJMP27eMzJWoHFUCen0fsf-aBhWw&oe=6A9171A6',
  address: 'Gedung Sekretariat Mahasiswa Lt. 2, Kampus Terpadu',
  contactEmail: 'himainformatika.official@univ.ac.id',
  contactPhone: '+62 812-3456-7890',
};

export const initialMembers: Member[] = [
  {
    id: 'm-01',
    nim: '2311501001',
    name: 'Fahry Aditya Setiawan',
    division: 'Badan Pengurus Harian (BPH)',
    role: 'Ketua Umum',
    phone: '081234567890',
    email: 'fahry.aditya@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-10',
    isActive: true,
  },
  {
    id: 'm-02',
    nim: '2311501002',
    name: 'Rian Pratama Wijaya',
    division: 'Badan Pengurus Harian (BPH)',
    role: 'Wakil Ketua',
    phone: '081345678901',
    email: 'rian.pratama@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-10',
    isActive: true,
  },
  {
    id: 'm-03',
    nim: '2311501003',
    name: 'Annisa Putri Rahmadani',
    division: 'Badan Pengurus Harian (BPH)',
    role: 'Sekretaris 1',
    phone: '081987654321',
    email: 'annisa.putri@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-10',
    isActive: true,
  },
  {
    id: 'm-04',
    nim: '2311501004',
    name: 'Nadia Salsabila Putri',
    division: 'Badan Pengurus Harian (BPH)',
    role: 'Bendahara 1',
    phone: '081298765432',
    email: 'nadia.salsabila@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-10',
    isActive: true,
  },
  {
    id: 'm-05',
    nim: '2311501010',
    name: 'Dimas Bagus Wicaksono',
    division: 'Divisi Acara & Program',
    role: 'Koordinator Divisi',
    phone: '082134567812',
    email: 'dimas.bagus@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-06',
    nim: '2311501012',
    name: 'Siti Sarah Nurhaliza',
    division: 'Divisi Acara & Program',
    role: 'Staf Ahli',
    phone: '085712345678',
    email: 'siti.sarah@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-07',
    nim: '2311501020',
    name: 'Bima Satria Nugraha',
    division: 'Divisi Media & Kreatif',
    role: 'Koordinator Divisi',
    phone: '081223344556',
    email: 'bima.satria@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-08',
    nim: '2311501022',
    name: 'Clara Amanda Cindy',
    division: 'Divisi Media & Kreatif',
    role: 'Anggota Aktif',
    phone: '087811223344',
    email: 'clara.amanda@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-09',
    nim: '2311501030',
    name: 'Farhan Rizki Ramadhan',
    division: 'Divisi Humas & Eksternal',
    role: 'Koordinator Divisi',
    phone: '085233445566',
    email: 'farhan.rizki@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-10',
    nim: '2311501032',
    name: 'Zahra Aulia Maharani',
    division: 'Divisi Humas & Eksternal',
    role: 'Anggota Aktif',
    phone: '081399887766',
    email: 'zahra.aulia@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a171edd2521d?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-11',
    nim: '2311501040',
    name: 'Eko Prasetyo Utomo',
    division: 'Divisi Logistik & Perlengkapan',
    role: 'Koordinator Divisi',
    phone: '082344556677',
    email: 'eko.prasetyo@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-12',
    nim: '2311501050',
    name: 'Reza Fauzan Maulana',
    division: 'Divisi Danus (Dana Usaha)',
    role: 'Koordinator Divisi',
    phone: '081266778899',
    email: 'reza.fauzan@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-13',
    nim: '2311501060',
    name: 'Kevin Jonathan Siregar',
    division: 'Divisi Litbang & Keilmuan',
    role: 'Koordinator Divisi',
    phone: '085799881122',
    email: 'kevin.jonathan@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  },
  {
    id: 'm-14',
    nim: '2311501062',
    name: 'Tiara Indah Lestari',
    division: 'Divisi Danus (Dana Usaha)',
    role: 'Anggota Aktif',
    phone: '081900112233',
    email: 'tiara.indah@student.ac.id',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    joinDate: '2025-01-15',
    isActive: true,
  }
];

export const initialEvents: AttendanceEvent[] = [
  {
    id: 'evt-01',
    title: 'Rapat Pleno Perdana & Sosialisasi Grand Design',
    type: 'Rapat Pleno',
    date: '2026-02-10',
    startTime: '13:30',
    endTime: '16:00',
    location: 'Ruang Seminar Fasilkom Lt. 3',
    locationType: 'offline',
    qrCodeToken: 'HIMA-PLENO-2026-01',
    status: 'completed',
    divisionTarget: 'Semua Divisi',
    organizer: 'BPH & Sekretariat',
    notes: 'Pemaparan program kerja seluruh divisi semester ganjil.',
  },
  {
    id: 'evt-02',
    title: 'Workshop Desain Grafis & Brand Identity HIMA',
    type: 'Workshop / Pelatihan',
    date: '2026-02-24',
    startTime: '09:00',
    endTime: '12:00',
    location: 'Lab Komputer Rekayasa Perangkat Lunak',
    locationType: 'offline',
    qrCodeToken: 'HIMA-WORKSHOP-MEDKRAF',
    status: 'completed',
    divisionTarget: 'Semua Divisi',
    organizer: 'Divisi Media & Kreatif',
    notes: 'Pelatihan Figma dan Photoshop untuk konten media sosial.',
  },
  {
    id: 'evt-03',
    title: 'Rapat Koordinasi Persiapan Informatics Expo 2026',
    type: 'Proker / Acara Utama',
    date: '2026-03-05',
    startTime: '15:30',
    endTime: '17:45',
    location: 'Ruang Rapat BEM & Himpunan',
    locationType: 'offline',
    qrCodeToken: 'HIMA-EXPO-RAKOR-01',
    status: 'completed',
    divisionTarget: 'Semua Divisi',
    organizer: 'Divisi Acara & Program',
    notes: 'Penetapan timeline, sponsorship target, dan pembagian tugas panitia.',
  },
  {
    id: 'evt-04',
    title: 'Rapat Evaluasi Tengah Periode & Laporan Kas',
    type: 'Rapat Pleno',
    date: '2026-03-20',
    startTime: '14:00',
    endTime: '16:30',
    location: 'Zoom Meeting Online (ID: 892 1123 4455)',
    locationType: 'online',
    qrCodeToken: 'HIMA-EVAL-KAS-01',
    status: 'active',
    divisionTarget: 'Semua Divisi',
    organizer: 'BPH (Ketua & Bendahara)',
    notes: 'Evaluasi ketercapaian target proker Q1 & audit kas organisasi.',
  },
  {
    id: 'evt-05',
    title: 'Kumpul Rutin & Brainstorming Karya Litbang',
    type: 'Kumpul Rutin',
    date: '2026-04-02',
    startTime: '16:00',
    endTime: '18:00',
    location: 'Gazebo Student Center Timur',
    locationType: 'offline',
    qrCodeToken: 'HIMA-LITBANG-BRAIN-01',
    status: 'upcoming',
    divisionTarget: 'Divisi Litbang & Keilmuan',
    organizer: 'Divisi Litbang & Keilmuan',
    notes: 'Penyusunan modul lomba competitive programming tingkat nasional.',
  }
];

export const initialAttendanceRecords: AttendanceRecord[] = [
  // Event 1 (completed)
  { id: 'att-1-1', eventId: 'evt-01', memberId: 'm-01', memberName: 'Fahry Aditya Setiawan', memberNim: '2311501001', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-02-10 13:25' },
  { id: 'att-1-2', eventId: 'evt-01', memberId: 'm-02', memberName: 'Rian Pratama Wijaya', memberNim: '2311501002', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-02-10 13:28' },
  { id: 'att-1-3', eventId: 'evt-01', memberId: 'm-03', memberName: 'Annisa Putri Rahmadani', memberNim: '2311501003', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-02-10 13:20' },
  { id: 'att-1-4', eventId: 'evt-01', memberId: 'm-04', memberName: 'Nadia Salsabila Putri', memberNim: '2311501004', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-02-10 13:22' },
  { id: 'att-1-5', eventId: 'evt-01', memberId: 'm-05', memberName: 'Dimas Bagus Wicaksono', memberNim: '2311501010', division: 'Divisi Acara & Program', status: 'hadir', timestamp: '2026-02-10 13:30' },
  { id: 'att-1-6', eventId: 'evt-01', memberId: 'm-06', memberName: 'Siti Sarah Nurhaliza', memberNim: '2311501012', division: 'Divisi Acara & Program', status: 'izin', timestamp: '2026-02-10 13:00', notes: 'Ada praktikum pengganti mata kuliah Jaringan Komputer' },
  { id: 'att-1-7', eventId: 'evt-01', memberId: 'm-07', memberName: 'Bima Satria Nugraha', memberNim: '2311501020', division: 'Divisi Media & Kreatif', status: 'hadir', timestamp: '2026-02-10 13:29' },
  { id: 'att-1-8', eventId: 'evt-01', memberId: 'm-08', memberName: 'Clara Amanda Cindy', memberNim: '2311501022', division: 'Divisi Media & Kreatif', status: 'hadir', timestamp: '2026-02-10 13:33' },
  { id: 'att-1-9', eventId: 'evt-01', memberId: 'm-09', memberName: 'Farhan Rizki Ramadhan', memberNim: '2311501030', division: 'Divisi Humas & Eksternal', status: 'hadir', timestamp: '2026-02-10 13:25' },
  { id: 'att-1-10', eventId: 'evt-01', memberId: 'm-10', memberName: 'Zahra Aulia Maharani', memberNim: '2311501032', division: 'Divisi Humas & Eksternal', status: 'sakit', timestamp: '2026-02-10 11:15', notes: 'Demam dan istirahat dokter' },
  { id: 'att-1-11', eventId: 'evt-01', memberId: 'm-11', memberName: 'Eko Prasetyo Utomo', memberNim: '2311501040', division: 'Divisi Logistik & Perlengkapan', status: 'hadir', timestamp: '2026-02-10 13:15' },
  { id: 'att-1-12', eventId: 'evt-01', memberId: 'm-12', memberName: 'Reza Fauzan Maulana', memberNim: '2311501050', division: 'Divisi Danus (Dana Usaha)', status: 'hadir', timestamp: '2026-02-10 13:31' },
  { id: 'att-1-13', eventId: 'evt-01', memberId: 'm-13', memberName: 'Kevin Jonathan Siregar', memberNim: '2311501060', division: 'Divisi Litbang & Keilmuan', status: 'hadir', timestamp: '2026-02-10 13:26' },
  { id: 'att-1-14', eventId: 'evt-01', memberId: 'm-14', memberName: 'Tiara Indah Lestari', memberNim: '2311501062', division: 'Divisi Danus (Dana Usaha)', status: 'hadir', timestamp: '2026-02-10 13:30' },

  // Event 2 (completed)
  { id: 'att-2-1', eventId: 'evt-02', memberId: 'm-01', memberName: 'Fahry Aditya Setiawan', memberNim: '2311501001', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-02-24 08:50' },
  { id: 'att-2-2', eventId: 'evt-02', memberId: 'm-03', memberName: 'Annisa Putri Rahmadani', memberNim: '2311501003', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-02-24 08:55' },
  { id: 'att-2-3', eventId: 'evt-02', memberId: 'm-07', memberName: 'Bima Satria Nugraha', memberNim: '2311501020', division: 'Divisi Media & Kreatif', status: 'hadir', timestamp: '2026-02-24 08:45' },
  { id: 'att-2-4', eventId: 'evt-02', memberId: 'm-08', memberName: 'Clara Amanda Cindy', memberNim: '2311501022', division: 'Divisi Media & Kreatif', status: 'hadir', timestamp: '2026-02-24 08:52' },
  { id: 'att-2-5', eventId: 'evt-02', memberId: 'm-05', memberName: 'Dimas Bagus Wicaksono', memberNim: '2311501010', division: 'Divisi Acara & Program', status: 'hadir', timestamp: '2026-02-24 08:58' },
  { id: 'att-2-6', eventId: 'evt-02', memberId: 'm-06', memberName: 'Siti Sarah Nurhaliza', memberNim: '2311501012', division: 'Divisi Acara & Program', status: 'hadir', timestamp: '2026-02-24 09:00' },
  { id: 'att-2-7', eventId: 'evt-02', memberId: 'm-13', memberName: 'Kevin Jonathan Siregar', memberNim: '2311501060', division: 'Divisi Litbang & Keilmuan', status: 'hadir', timestamp: '2026-02-24 08:59' },
  { id: 'att-2-8', eventId: 'evt-02', memberId: 'm-12', memberName: 'Reza Fauzan Maulana', memberNim: '2311501050', division: 'Divisi Danus (Dana Usaha)', status: 'alpa', timestamp: '2026-02-24 12:00' },

  // Event 4 (active)
  { id: 'att-4-1', eventId: 'evt-04', memberId: 'm-01', memberName: 'Fahry Aditya Setiawan', memberNim: '2311501001', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-03-20 13:50' },
  { id: 'att-4-2', eventId: 'evt-04', memberId: 'm-03', memberName: 'Annisa Putri Rahmadani', memberNim: '2311501003', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-03-20 13:52' },
  { id: 'att-4-3', eventId: 'evt-04', memberId: 'm-04', memberName: 'Nadia Salsabila Putri', memberNim: '2311501004', division: 'Badan Pengurus Harian (BPH)', status: 'hadir', timestamp: '2026-03-20 13:55' },
  { id: 'att-4-4', eventId: 'evt-04', memberId: 'm-09', memberName: 'Farhan Rizki Ramadhan', memberNim: '2311501030', division: 'Divisi Humas & Eksternal', status: 'hadir', timestamp: '2026-03-20 14:02' },
];

export const initialTransactions: Transaction[] = [];

export const generateInitialDues = (members: Member[]): MonthlyDuesRecord[] => {
  const records: MonthlyDuesRecord[] = [];
  const currentYear = 2026;

  members.forEach((member, mIdx) => {
    // Generate months 1 to 12
    for (let month = 1; month <= 12; month++) {
      let status: 'lunas' | 'belum' | 'bebas' = 'belum';
      let paymentDate: string | undefined = undefined;
      let paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS / E-Wallet' | undefined = undefined;
      let receiptNumber: string | undefined = undefined;

      // Jan (1) & Feb (2) mostly paid
      if (month === 1) {
        status = 'lunas';
        paymentDate = `2026-01-${(15 + (mIdx % 10)).toString().padStart(2, '0')}`;
        paymentMethod = mIdx % 2 === 0 ? 'Transfer Bank' : 'QRIS / E-Wallet';
        receiptNumber = `KAS-2026-01-${(mIdx + 1).toString().padStart(3, '0')}`;
      } else if (month === 2) {
        status = 'lunas';
        paymentDate = `2026-02-${(14 + (mIdx % 10)).toString().padStart(2, '0')}`;
        paymentMethod = mIdx % 3 === 0 ? 'Tunai' : 'Transfer Bank';
        receiptNumber = `KAS-2026-02-${(mIdx + 1).toString().padStart(3, '0')}`;
      } else if (month === 3) {
        // March: some paid, some pending
        if (mIdx < 10) {
          status = 'lunas';
          paymentDate = `2026-03-${(10 + (mIdx % 8)).toString().padStart(2, '0')}`;
          paymentMethod = 'QRIS / E-Wallet';
          receiptNumber = `KAS-2026-03-${(mIdx + 1).toString().padStart(3, '0')}`;
        } else {
          status = 'belum';
        }
      } else {
        // Future months: pending
        status = 'belum';
      }

      records.push({
        id: `due-${member.id}-${currentYear}-${month}`,
        memberId: member.id,
        year: currentYear,
        month,
        amount: 20000,
        status,
        paymentDate,
        paymentMethod,
        receiptNumber,
        notes: status === 'lunas' ? 'Lunas tepat waktu' : undefined
      });
    }
  });

  return records;
};

export const initialBudgetPlans: BudgetPlan[] = [
  {
    id: 'rab-01',
    prokerName: 'Grand Design & Pelantikan Pengurus',
    division: 'Badan Pengurus Harian (BPH)',
    allocatedBudget: 1200000,
    realizedBudget: 770000,
    date: '2026-02-10',
    status: 'Selesai',
  },
  {
    id: 'rab-02',
    prokerName: 'Informatics Expo & Tech Fest 2026',
    division: 'Divisi Acara & Program',
    allocatedBudget: 8500000,
    realizedBudget: 2850000,
    date: '2026-05-15',
    status: 'Berjalan',
  },
  {
    id: 'rab-03',
    prokerName: 'Pelatihan UI/UX & Pembuatan Website Himpunan',
    division: 'Divisi Media & Kreatif',
    allocatedBudget: 1500000,
    realizedBudget: 430000,
    date: '2026-02-24',
    status: 'Selesai',
  },
  {
    id: 'rab-04',
    prokerName: 'Company Visit & Studi Banding Industri',
    division: 'Divisi Humas & Eksternal',
    allocatedBudget: 3000000,
    realizedBudget: 250000,
    date: '2026-06-20',
    status: 'Berjalan',
  },
  {
    id: 'rab-05',
    prokerName: 'Informatics Competitive Programming Contest',
    division: 'Divisi Litbang & Keilmuan',
    allocatedBudget: 2500000,
    realizedBudget: 0,
    date: '2026-07-10',
    status: 'Direncanakan',
  },
];
