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
    id: 'upd-v2.9.0',
    version: 'v2.9.0',
    title: 'Penyempurnaan Antarmuka HP Siswa (Form Presensi Mandiri Langsung)',
    date: '2026-08-30',
    category: 'UI/UX',
    description: 'Menyembunyikan tombol tab "Tampilkan QR Code Sesi" secara otomatis saat siswa mendeteksi QR Code di HP, sehingga layar HP siswa langsung menampilkan Form Presensi Mandiri secara bersih dan fokus.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan prop hideQrTab={true} pada modal presensi publik di App.tsx.',
      'Siswa yang memindai QR Code di HP langsung disajikan Form Check-In Mandiri tanpa opsi menampilkan QR Code kembali.',
      'Membuat antarmuka HP siswa lebih bersih, intuitif, dan tidak membingungkan.'
    ]
  },
  {
    id: 'upd-v2.8.0',
    version: 'v2.8.0',
    title: 'Perbaikan Bug Fatal White Screen Presensi QR (Akses Tanpa Login)',
    date: '2026-08-30',
    category: 'Perbaikan Bug',
    description: 'Perbaikan bug fatal layar putih polos (White Screen) saat siswa/peserta mendeteksi QR Code presensi web tanpa login sebagai admin. Menyelaraskan seluruh prop (config, attendanceRecords, & handler) pada kondisi unauthenticated.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Memperbaiki crash TypeError pada komponen SelfCheckInModal saat diakses oleh pengguna publik/unauthenticated.',
      'Menyertakan prop wajib config & attendanceRecords yang sebelumnya terlewat.',
      'Menghubungkan handler handleRecordAttendance agar rekaman presensi siswa langsung tersimpan ke database NeonDB Cloud.'
    ]
  },
  {
    id: 'upd-v2.7.0',
    version: 'v2.7.0',
    title: 'Optimasi QR Code Instan (0ms Render) & Kartu Tampilan Data Lengkap Siswa',
    date: '2026-08-30',
    category: 'Perbaikan Bug',
    description: 'Perbaikan bug loading QR Code yang lambat menjadi 0ms instant SVG rendering dengan cache memori, serta penambahan Kartu Data Lengkap Siswa (Nama, NISN, Kelas, Sekbid, & Jabatan) sebelum konfirmasi presensi.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Mengganti generator Canvas QR Code dengan SVG Data URI synchronous untuk render instan dalam <1ms.',
      'Menambahkan memori cache QR Code per eventId untuk mencegah loading ulang.',
      'Menampilkan Kartu Preview Data Lengkap Siswa/Pengurus (Nama, NISN/NIM, Kelas, Sekbid, Jabatan, & Verifikasi) saat memilih nama.',
      'Menghubungkan otomatis rekaman presensi mandiri ke tabel Manajemen Absensi & Kegiatan OSIS dan sinkronisasi NeonDB Cloud.'
    ]
  },
  {
    id: 'upd-v2.6.0',
    version: 'v2.6.0',
    title: 'Transformasi Layout Left Sidebar (Sidebar Kiri Modern)',
    date: '2026-08-30',
    category: 'UI/UX',
    description: 'Pemindahan seluruh 9 menu navigasi utama menjadi Left Sidebar (Sidebar Kiri) bergaya SaaS Dashboard Premium dengan indikator NeonDB Cloud, drawer mobile responsif, dan verifikasi koneksi halaman 100%.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Memindahkan navigasi atas (Navbar) menjadi Left Sidebar Fixed pada layar desktop.',
      'Menyusun 9 menu navigasi vertikal: Dashboard, 10 Sekbid, Absensi, Buku Kas, Iuran Kas, Laporan, Anggota, Pengaturan, dan Riwayat Update.',
      'Menambahkan efek sorot menu aktif dengan latar Soft Indigo & indikator melayang.',
      'Menambahkan Top Header Bar ringkas dengan efek glassmorphic backdrop-blur.',
      'Menambahkan Mobile Drawer responsif untuk layar HP/Tablet dengan tombol hamburger menu.',
      'Memverifikasi konektivitas 9 menu navigasi terhubung 100% tepat ke masing-masing komponen halaman.'
    ]
  },
  {
    id: 'upd-v2.5.0',
    version: 'v2.5.0',
    title: 'Penerapan Soft Pastel UI pada Seluruh Halaman Utama & Fitur Changelog',
    date: '2026-08-30',
    category: 'UI/UX',
    description: 'Penerapan menyeluruh estetika Soft Pastel Modern UI pada halaman 10 Sekbid, Absensi Kegiatan, Buku Kas, Iuran Kas, dan Direktori 40 Anggota Pengurus, serta peluncuran modul Riwayat Update Sistem.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Penerapan kartu statistik Soft Pastel & Floating White Circle Icons pada halaman 10 Sekbid OSIS.',
      'Redesain header & kartu metrik presensi pada halaman Absensi Kegiatan.',
      'Redesain kartu Saldo Kas Bersih, Penerimaan, & Pengeluaran pada halaman Buku Kas.',
      'Redesain kartu Total Iuran, Tunggakan, & Kepatuhan pada halaman Iuran Kas Anggota.',
      'Redesain banner direktori & tombol aksi glassmorphic pada halaman 40 Anggota Pengurus.',
      'Peluncuran tab baru "Riwayat Update" (Changelog & System History) di sebelah tab Pengaturan.'
    ]
  },
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
