import { 
  OrganizationConfig, 
  Member, 
  AttendanceEvent, 
  AttendanceRecord, 
  Transaction, 
  MonthlyDuesRecord, 
  BudgetPlan,
  UpcomingUpdate
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
  duesStartWeek: 1,   // Mulai Minggu 1 (default)
  globalExemptWeeks: [],
  bankName: 'Bank Mandiri / QRIS Kas OSIS SKARLAKES',
  bankAccountNumber: '',
  bankAccountHolder: 'BENDAHARA OSIS SKARLAKES',
  logoUrl: '/logo.png',
  address: 'Ruang Sekretariat OSIS SKARLAKES',
  contactEmail: 'osis.skarlakes@gmail.com',
  contactPhone: '',
  geminiApiKey: '',
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
    id: 'upd-v5.0.0',
    version: 'v5.0.0',
    title: 'Peluncuran Fitur Utama OSIS AI: Multi-Turn Chat Memory & Cetak PDF',
    date: '2026-08-30',
    category: 'Integrasi AI',
    description: 'Penyempurnaan tuntas 5 limitasi OSIS AI Intelligence: menambahkan ingatan obrolan bertahap (Multi-Turn Chat Memory), indikator status model AI (Cloud vs Local), dan tombol cetak PDF resume analisis AI.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan Multi-Turn Chat Memory pada getAiAssistantResponse agar AI mengingat konteks obrolan bertahap.',
      'Menambahkan Engine Status Indicator Badge (🟢 Gemini 3.6 Flash vs ⚡ Offline Engine) pada header modal AI.',
      'Menambahkan fitur Cetak / Ekspor PDF Resume Percakapan AI dengan 1-Click Printer handler.'
    ]
  },
  {
    id: 'upd-v4.6.0',
    version: 'v4.6.0',
    title: 'Desain Mewah Elegan & Dual-Mode Visualisasi Roadmap System',
    date: '2026-08-30',
    category: 'UI/UX',
    description: 'Penyempurnaan estetika visual pada halaman List Update dengan efek Glassmorphism dark luxury header, background gradient orbs, dan tombol perubah tampilan Dual-Mode (Grid Cards & Executive Timeline Release).',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan efek Glassmorphism & Mesh Blur Background Orbs pada banner utama Roadmap.',
      'Menyediakan tombol pemicu Dual-Mode Tampilan: Mode Grid Kartu & Mode Timeline Pipeline Release.',
      'Mempercantik kartu indikator status (Segera Hadir, Dalam Pengembangan, Direncanakan) dan tombol dukungan upvote.'
    ]
  },
  {
    id: 'upd-v4.5.0',
    version: 'v4.5.0',
    title: 'Peluncuran Modul List Update & Roadmap Fitur Masa Depan',
    date: '2026-08-30',
    category: 'Fitur Baru',
    description: 'Menambahkan menu "List Update" pada Left Sidebar navigasi utama untuk menampilkan seluruh daftar fitur yang akan tiba, target rilis versi mendatang (v4.5.0 s.d. v6.0.0), dan tombol dukungan upvote.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan menu navigasi "List Update (Akan Tiba)" pada Left Sidebar dengan ikon Rocket.',
      'Membuat komponen halaman UpcomingUpdatesView.tsx untuk menampilkan kartu rencana release.',
      'Menambahkan fitur dukungan upvote interaktif untuk pengurus memberi umpan balik fitur favorit.'
    ]
  },
  {
    id: 'upd-v4.2.0',
    version: 'v4.2.0',
    title: 'Perbaikan Presisi Respon AI & Intent Matching Pertanyaan Spesifik',
    date: '2026-08-30',
    category: 'Perbaikan Bug',
    description: 'Penyempurnaan deteksi intent pertanyaan pada Asisten AI OSIS. Pertanyaan spesifik seperti "berapa jumlah total siswa" dan "berapa uang kas per siswa" kini dijawab secara langsung dan presisi tanpa tertukar draf WA.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Memperbaiki logika intent matching pada generateSmartLocalAiResponse di aiService.ts.',
      'Menambahkan respon presisi untuk pertanyaan jumlah total anggota dan tarif nominal kas per siswa.',
      'Menyempurnakan integrasi model Google Gemini 3.6 Flash untuk respon AI context-aware.'
    ]
  },
  {
    id: 'upd-v4.1.0',
    version: 'v4.1.0',
    title: 'Dukungan Kunci API Google Gemini Cloud & Konfigurasi Pengaturan',
    date: '2026-08-30',
    category: 'Database / Cloud',
    description: 'Menambahkan kolom masukan Google Gemini API Key pada menu Pengaturan dan file lingkungan (.env), memungkinkan integrasi langsung ke model AI Cloud Google Gemini 1.5/2.5 Flash.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan field geminiApiKey pada OrganizationConfig.',
      'Menyediakan kolom masukan kunci API Google Gemini pada menu Pengaturan.',
      'Menyinkronkan kunci API secara aman ke NeonDB Cloud & localStorage.'
    ]
  },
  {
    id: 'upd-v4.0.0',
    version: 'v4.0.0',
    title: 'Peluncuran Asisten AI Pintar Organisasi (OSIS AI Intelligence)',
    date: '2026-08-30',
    category: 'Fitur Baru',
    description: 'Integrasi kecerdasan buatan OSIS AI Intelligence berbasis Google Gemini 1.5/2.5 Flash & Smart Local Inference Engine untuk audit kas, evaluasi presensi, generator proker 10 sekbid, dan draf WhatsApp.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan service aiService.ts yang terintegrasi live context data organisasi.',
      'Menambahkan komponen AiAssistantModal.tsx dengan 4 mode prompt cepat 1-klik.',
      'Menyediakan Floating Glow Widget AI Button di pojok kanan bawah layar.',
      'Mendukung salin pesan WhatsApp pengingat kas secara otomatis.'
    ]
  },
  {
    id: 'upd-v3.4.0',
    version: 'v3.4.0',
    title: 'Redesain Modal Input Pembayaran Kas (Layout 2-Kolom Ringkas & Ergonomis)',
    date: '2026-08-30',
    category: 'UI/UX',
    description: 'Penyempurnaan tata letak Modal Input Pembayaran Kas di DuesView.tsx menjadi 2-Column Grid ringkas sehingga tidak kepanjangan secara vertikal dan pas di semua resolusi layar.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menstrukturkan modal pembayaran menjadi Layout 2-Kolom (Kolom Kiri: Profil & Pilihan Minggu/Bulan; Kolom Kanan: Nominal & Metode).',
      'Mengurangi padding vertikal dan tinggi elemen tanpa mengurangi informasi penting.',
      'Membuat antarmuka input iuran kas lebih cepat, efisien, dan estetis di laptop maupun HP.'
    ]
  },
  {
    id: 'upd-v3.3.0',
    version: 'v3.3.0',
    title: 'Kalkulasi Otomatis Pengurangan Tunggakan Iuran (Minggu Bebas Kas)',
    date: '2026-08-30',
    category: 'Perbaikan Bug',
    description: 'Perbaikan kalkulasi statistik pada Card Tunggakan dan Slot Unpaid Iuran Kas. Saat minggu bebas/libur kas diaktifkan, jumlah slot tunggakan dan total rupiah tagihan otomatis berkurang secara presisi.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Memperbaiki rumus kalkulasi unpaidSlotsPeriod dan totalArrearsAmount di DuesView.tsx.',
      'Minggu yang ditandai Bebas/Libur Kas (bebas) secara otomatis mengurangi jumlah slot tunggakan per anggota.',
      'Statistik kepatuhan periode dan total tunggakan langsung tersinkronkan 100% akurat.'
    ]
  },
  {
    id: 'upd-v3.2.0',
    version: 'v3.2.0',
    title: 'Pengaturan Global Minggu Mulai Kas & Sinkronisasi 40+ Anggota',
    date: '2026-08-30',
    category: 'Fitur Baru',
    description: 'Penambahan opsi "Minggu Mulai Efektif Kas Global" dan "Minggu Libur Kas Global" di halaman Pengaturan. Seluruh 40+ anggota OSIS di direktori otomatis tersinkron tanpa perlu dikonfigurasi satu persatu.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan field duesStartWeek dan globalExemptWeeks pada OrganizationConfig.',
      'Menambahkan kontrol Minggu Mulai Efektif Kas & Checkbox Minggu Libur Kas pada menu Pengaturan.',
      'Secara otomatis mensinkronkan status Bebas Kas (🌴 Libur (Global)) bagi seluruh 40+ anggota dan disinkronkan ke NeonDB Cloud.'
    ]
  },
  {
    id: 'upd-v3.1.0',
    version: 'v3.1.0',
    title: 'Fleksibilitas Iuran Kas Mingguan & Penandaan Bebas / Libur Kas',
    date: '2026-08-30',
    category: 'Fitur Baru',
    description: 'Dukungan fleksibel untuk kasus di mana iuran baru dimulai pada minggu ke-2/3 atau terdapat minggu bebas kas. Bendahara dapat menandai minggu tertentu sebagai "Bebas/Libur Kas" tanpa dihitung sebagai tunggakan.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menambahkan mode status "Tandai Bebas / Libur Kas" pada modal pembayaran iuran mingguan & bulanan.',
      'Menampilkan badge visual Soft Purple 🌴 Bebas Mgg X pada tabel matriks iuran.',
      'Minggu yang ditandai bebas kas secara otomatis tidak dihitung sebagai tunggakan dan persentase kepatuhan dihitung 100% akurat.'
    ]
  },
  {
    id: 'upd-v3.0.0',
    version: 'v3.0.0',
    title: 'Sistem Sesi Login Persisten (Tahan Refresh F5 / Browser Reload)',
    date: '2026-08-30',
    category: 'Fitur Baru',
    description: 'Implementasi persistent session storage sehingga pengurus/admin yang sudah login tidak akan terlempar kembali ke halaman login saat halaman web di-refresh (F5) atau tab ditutup.',
    author: 'Fahry Aditya Setiawan',
    changesList: [
      'Menyimpan active session akun login ke localStorage dengan enkapsulasi aman.',
      'Membaca dan memulihkan sesi aktif secara otomatis saat aplikasi dimuat ulang.',
      'Sesi bertahan setelah F5 refresh dan hanya berakhir jika pengguna secara eksplisit mengklik tombol Keluar (Logout).'
    ]
  },
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

export const initialUpcomingUpdates: UpcomingUpdate[] = [
  {
    id: 'upc-v4.5.0',
    versionTarget: 'v4.5.0',
    title: 'Telah Hadir OSIS AI Intelligence (Beta)',
    targetDate: '1 September 2026',
    category: 'Integrasi AI',
    status: 'Uji Coba Beta',
    description: 'Peluncuran perdana Asisten Pintar Organisasi OSIS AI Intelligence (Beta) yang terhubung langsung dengan Google Gemini 3.6 Flash & Data Real-Time Organisasi.',
    featuresPlanned: [
      'Peluncuran OSIS AI Intelligence (Beta) berbasis Google Gemini 3.6 Flash Cloud.',
      'Analisis Kecerdasan Keuangan Kas, Evaluasi Presensi Rapat, & Generator Proker Sekbid.',
      'Generator Draf Pesan WhatsApp Pengingat Iuran Kas 1-Click Copy.'
    ],
    upvotesCount: 68
  },
  {
    id: 'upc-v4.6.0',
    versionTarget: 'v4.6.0',
    title: 'Notifikasi Otomatis WhatsApp & Bot Telegram Pengurus',
    targetDate: 'Oktober 2026',
    category: 'Mobilitas & Notifikasi',
    status: 'Segera Hadir',
    description: 'Pengiriman nota resmi kwitansi pembayaran iuran kas dan pengingat presensi rapat langsung ke WhatsApp dan Telegram pengurus secara otomatis.',
    featuresPlanned: [
      'Integrasi WhatsApp Gateway API & Bot Telegram OSIS.',
      'Kirim kwitansi iuran kas otomatis via WA begitu Bendahara mengonfirmasi Lunas.',
      'Pengingat presensi H-1 dan H-1 jam sebelum rapat dimulai.'
    ],
    upvotesCount: 42
  },
  {
    id: 'upc-v5.0.0',
    versionTarget: 'v5.0.0',
    title: 'Analytics Dashboard & Heatmap Keaktifan 10 Sekbid',
    targetDate: 'November 2026',
    category: 'UI/UX',
    status: 'Dalam Pengembangan',
    description: 'Visualisasi grafis tingkat lanjut berupa diagram pie alokasi anggaran kas, grafik tren pemasukan/pengeluaran, dan Heatmap keaktifan presensi per Sekbid.',
    featuresPlanned: [
      'Chart interaktif Recharts / Chart.js untuk alokasi dana per Sekbid.',
      'Heatmap keaktifan pengurus bulanan (Skor Partisipasi OSIS).',
      'Laporan performa Proker Sekbid siap unduh PDF.'
    ],
    upvotesCount: 38
  },
  {
    id: 'upc-v5.1.0',
    versionTarget: 'v5.1.0',
    title: 'Dynamic QRIS Kasir & Digital Member ID Pass Card',
    targetDate: 'November 2026',
    category: 'Fitur Baru',
    status: 'Direncanakan',
    description: 'Fitur Kartu Pengurus Digital (Digital Pass ID Card) berbasis QR/NFC serta QRIS dinamis otomatis untuk pembayaran iuran kas sekolah secara instan.',
    featuresPlanned: [
      'Generasi QRIS dinamis otomatis sesuai jumlah tagihan iuran kas.',
      'Kartu Tanda Pengurus OSIS Digital dengan Apple Wallet / Google Wallet pass card.',
      'Verifikasi identitas pengurus via Scan QR Member.'
    ],
    upvotesCount: 29
  },
  {
    id: 'upc-v6.0.0',
    versionTarget: 'v6.0.0',
    title: 'Voice Command AI & Auto-Minutes Rapat AI (Notula PDF Otomatis)',
    targetDate: 'Desember 2026',
    category: 'Integrasi AI',
    status: 'Direncanakan',
    description: 'Perekaman dan transkripsi suara rapat otomatis menjadi Notula Rapat Resmi PDF serta perintah suara (Voice Command) untuk asisten AI OSIS.',
    featuresPlanned: [
      'Transkripsi rekaman audio rapat menjadi Notula Rapat Resmi PDF.',
      'Asisten AI berbasis Perintah Suara (Voice Command OSIS AI).',
      'Ekspor resume poin rapat langsung ke grup WhatsApp.'
    ],
    upvotesCount: 51
  }
];
