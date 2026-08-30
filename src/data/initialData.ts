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

export const initialSystemUpdates: import('../types').SystemUpdate[] = [
  {
    id: 'upd-v2.4.0',
    version: 'v2.4.0',
    title: 'Redesain Soft Pastel UI & Widget Interaktif Dashboard',
    date: '2026-08-30',
    category: 'UI/UX',
    description: 'Transformasi antarmuka dashboard utama mengadopsi estetika Soft Pastel Modern UI dengan visual depth, icon melayang, dan chart interaktif.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Memperbarui 4 kartu statistik utama dengan warna latar Soft Pastel (Indigo, Mint Emerald, Rose, dan Sky Blue).',
      'Menambahkan icon chip melayang di dalam lingkaran putih bersih pada setiap kartu metrik.',
      'Mengubah grafik arus kas menjadi Area Spline Chart dengan isian gradien halus (linearGradient).',
      'Menambahkan Donut Chart alokasi pengeluaran dengan label total nominal tepat di pusat lingkaran.',
      'Menambahkan widget progress bar keaktifan presensi per Divisi / Sekbid.',
      'Menambahkan Timeline Feed Aktivitas Pengurus dan Catatan Kas Terakhir dengan avatar inisial.'
    ]
  },
  {
    id: 'upd-v2.3.0',
    version: 'v2.3.0',
    title: 'Portal 10 Sekbid OSIS & Integrasi NeonDB Cloud',
    date: '2026-08-25',
    category: 'Fitur Baru',
    description: 'Peluncuran modul manajemen 10 Sekbid OSIS lengkap dengan rincian Ketua, Anggota, Proker, serta integrasi Cloud PostgreSQL NeonDB.',
    author: 'Administrator OSIS',
    changesList: [
      'Modul khusus manajemen Sekbid 1 s.d. Sekbid 10 dengan rincian tugas dan proker unggulan.',
      'Integrasi backend API Vercel Serverless Function & NeonDB Cloud PostgreSQL.',
      'Penyelarasan otomatis data pengurus, transaksi, dan absensi secara real-time.'
    ]
  },
  {
    id: 'upd-v2.2.0',
    version: 'v2.2.0',
    title: 'Sistem Sesi Presensi QR Digital & Self Check-In',
    date: '2026-08-18',
    category: 'Fitur Baru',
    description: 'Kemudahan absensi kegiatan rapat dan acara OSIS menggunakan scanner QR Code otomatis.',
    author: 'Divisi TIK & Publikasi Media',
    changesList: [
      'Pembuatan sesi presensi rapat/acara dengan QR Code Generator otomatis.',
      'Fitur Presensi Mandiri (Self Check-In) bagi siswa/anggota OSIS.',
      'Pencatatan status kehadiran (Hadir, Izin, Sakit, Alpa) beserta bukti foto/surat.'
    ]
  },
  {
    id: 'upd-v2.1.0',
    version: 'v2.1.0',
    title: 'Buku Kas Terpadu & Generator Kwitansi Struk Digital',
    date: '2026-08-10',
    category: 'Fitur Baru',
    description: 'Pencatatan kas masuk & keluar dilengkapi pencetakan kwitansi pertanggungjawaban dana.',
    author: 'Bendahara Umum OSIS',
    changesList: [
      'Modul transaksi kas cepat (Quick Transaction).',
      'Generator Struk / Kwitansi Digital yang dapat diunduh & dicetak.',
      'Matriks monitoring kepatuhan iuran anggota mingguan & bulanan.'
    ]
  },
  {
    id: 'upd-v2.0.0',
    version: 'v2.0.0',
    title: 'Peluncuran Awal Portal Terpadu OSIS-SKARLAKES',
    date: '2026-08-01',
    category: 'Fitur Baru',
    description: 'Rilis perdana aplikasi web manajemen terpadu OSIS SMK Airlangga & SMK Kesehatan Airlangga.',
    author: 'Pengurus Harian BPH',
    changesList: [
      'Modul Manajemen Database Anggota Pengurus.',
      'Laporan & Rekapitulasi Otomatis (Print/PDF Ready).',
      'Modul Pengaturan Identitas Organisasi OSIS.'
    ]
  }
];


export const initialBudgetPlans: BudgetPlan[] = [];
