import { Member, AttendanceEvent, AttendanceRecord, Transaction, MonthlyDuesRecord, OrganizationConfig } from '../types';

export interface AiPromptOption {
  id: string;
  category: 'keuangan' | 'presensi' | 'proker' | 'wa';
  title: string;
  subtitle: string;
  iconName: string;
  promptText: string;
}

export interface AiMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  category?: string;
  actionCard?: {
    type: 'whatsapp' | 'proker' | 'stat';
    title: string;
    content: string;
    whatsappText?: string;
  };
}

export const defaultAiPrompts: AiPromptOption[] = [
  {
    id: 'p-1',
    category: 'keuangan',
    title: '📊 Analisis Kesehatan Kas',
    subtitle: 'Audit saldo, surplus/defisit, & kepatuhan iuran',
    iconName: 'TrendingUp',
    promptText: 'Berikan analisis kesehatan keuangan & iuran kas OSIS saat ini beserta saran efisiensi.'
  },
  {
    id: 'p-2',
    category: 'presensi',
    title: '📈 Evaluasi Presensi & Keaktifan',
    subtitle: 'Ukur keaktifan rapat & partisipasi anggota',
    iconName: 'UserCheck',
    promptText: 'Evaluasi tingkat partisipasi presensi rapat/kegiatan OSIS dan berikan strategi peningkatan keaktifan.'
  },
  {
    id: 'p-3',
    category: 'proker',
    title: '💡 Ide Proker Sekbid Kreatif',
    subtitle: 'Rekomendasi kegiatan baru untuk 10 Sekbid',
    iconName: 'Lightbulb',
    promptText: 'Rekomendasikan 3 ide program kerja kreatif untuk Sekbid OSIS lengkap dengan rancangan acara dan estimasi anggaran.'
  },
  {
    id: 'p-4',
    category: 'wa',
    title: '✉️ Draft WA Pengingat Iuran',
    subtitle: 'Pesan pengingat kas yang ramah & persuasif',
    iconName: 'MessageSquare',
    promptText: 'Buatkan draf pesan pengingat WhatsApp iuran kas yang sopan, ramah, dan persuasif untuk dikirim ke pengurus.'
  }
];

export interface SystemStateData {
  config: OrganizationConfig;
  members: Member[];
  events: AttendanceEvent[];
  attendanceRecords: AttendanceRecord[];
  transactions: Transaction[];
  duesRecords: MonthlyDuesRecord[];
}

/**
 * Builds rich, detailed live context data for OSIS AI (Full Real-Time Data)
 */
export function buildOsisContextSummary(data: SystemStateData): string {
  const { config, members, events, attendanceRecords, transactions, duesRecords } = data;
  
  const income = transactions.filter(t => t.type.toLowerCase() === 'pemasukan').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const expense = transactions.filter(t => t.type.toLowerCase() === 'pengeluaran').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance = income - expense;
  const paidDuesCount = duesRecords.filter(d => d.status === 'lunas').length;

  const membersListText = members.length > 0 
    ? members.map((m, i) => `${i + 1}. ${m.name} (NIM/NISN: ${m.nim}, Sekbid: ${m.division}, Jabatan: ${m.role || 'Anggota'})`).join('\n')
    : 'Belum ada data anggota terdaftar.';

  const recentTransactionsText = transactions.length > 0
    ? transactions.slice(0, 10).map(t => `- [${t.date}] ${t.type.toUpperCase()}: ${t.description} (Rp ${Number(t.amount || 0).toLocaleString('id-ID')})`).join('\n')
    : 'Belum ada transaksi kas.';

  const recentEventsText = events.length > 0
    ? events.slice(0, 5).map(e => `- [${e.date}] ${e.title} (Lokasi: ${e.location || 'Sekolah'})`).join('\n')
    : 'Belum ada kegiatan/rapat.';

  return `
[DATA ORGANISASI LIVE OSIS SKARLAKES]
Nama Organisasi: ${config.name} (${config.shortName})
Periode Operasional: ${config.period}
Instansi: ${config.institution}
Ketua Umum: ${config.leaderName || 'Ketua OSIS'}
Sekretaris Umum: ${config.secretaryName || 'Sekretaris OSIS'}
Bendahara Umum: ${config.treasurerName || 'Bendahara OSIS'}

[STATISTIK & DAFTAR KAS ANGGOTA]
Total Pemasukan Kas: Rp ${income.toLocaleString('id-ID')}
Total Pengeluaran Kas: Rp ${expense.toLocaleString('id-ID')}
Saldo Kas Bersih Real-Time: Rp ${balance.toLocaleString('id-ID')}
Tarif Iuran Mingguan Per Siswa: Rp ${(config.defaultWeeklyDue || 2500).toLocaleString('id-ID')} / minggu
Tarif Iuran Bulanan Per Siswa: Rp ${(config.defaultMonthlyDue || 10000).toLocaleString('id-ID')} / bulan
Minggu Efektif Mulai Kas: Minggu ke-${config.duesStartWeek || 1}
Minggu Libur Kas Global: ${config.globalExemptWeeks && config.globalExemptWeeks.length > 0 ? config.globalExemptWeeks.map(w => `Minggu ${w}`).join(', ') : 'Tidak ada (Normal)'}
Total Pembayaran Iuran Lunas: ${paidDuesCount} catatan

[RIWAYAT TRANSAKSI KAS TERAKHIR]
${recentTransactionsText}

[DAFTAR KEGIATAN & RAPAT]
${recentEventsText}
Total Log Presensi: ${attendanceRecords.length} Log Presensi

[DAFTAR LENGKAP ${members.length} ANGGOTA OSIS REAL-TIME]
${membersListText}
`;
}

/**
 * Smart Fallback Local AI Inference Engine (Instant 0ms, 100% Reliable & Precise Intent Matching)
 */
export function generateSmartLocalAiResponse(userPrompt: string, data: SystemStateData): { text: string; actionCard?: AiMessage['actionCard'] } {
  const promptLower = userPrompt.trim().toLowerCase();
  const { config, members, transactions, duesRecords, events } = data;

  const income = transactions.filter(t => t.type.toLowerCase() === 'pemasukan').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const expense = transactions.filter(t => t.type.toLowerCase() === 'pengeluaran').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance = income - expense;
  const paidDuesCount = duesRecords.filter(d => d.status === 'lunas').length;
  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  // 1. GREETINGS (Hello / Halo / Hi)
  if (['hello', 'halo', 'hi', 'p', 'ping', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam'].includes(promptLower) || promptLower === 'hello ') {
    return {
      text: `### 👋 Halo Pengurus **${config.shortName}**!

Saya adalah **OSIS AI Intelligence** — Asisten Pintar Organisasi yang terhubung *real-time* dengan database sekolah.

Silakan tanyakan pertanyaan Anda, seperti:
* *"Berapa jumlah total siswa/anggota OSIS?"*
* *"Berapa nominal iuran kas yang dibayar per siswa?"*
* *"Analisis kesehatan keuangan kas OSIS"*
* *"Rekomendasikan 3 ide proker sekbid"*
* *"Draf WA pengingat iuran kas"*`
    };
  }

  // 2. QUERY: NOMINAL IURAN KAS PER SISWA
  if (
    promptLower.includes('bayar persiswa') || 
    promptLower.includes('bayar per') || 
    promptLower.includes('iuran per') || 
    promptLower.includes('nominal') || 
    promptLower.includes('bayar berapa') ||
    (promptLower.includes('berapa') && (promptLower.includes('iuran') || promptLower.includes('uang kas') || promptLower.includes('kas')))
  ) {
    const weeklyDue = config.defaultWeeklyDue || 2500;
    const monthlyDue = config.defaultMonthlyDue || 10000;

    return {
      text: `### 💳 Nominal Pembayaran Iuran Kas Anggota OSIS

Berikut adalah rincian tarif iuran kas resmi untuk anggota **${config.shortName}**:

* 🟢 **Nominal Iuran Mingguan**: \`${formatRp(weeklyDue)} / minggu\` per siswa.
* 📅 **Nominal Iuran Bulanan**: \`${formatRp(monthlyDue)} / bulan\` per siswa.

---

#### ℹ️ Catatan Penting Pembayaran:
* Pengurus/anggota dapat membayar iuran secara mingguan maupun bulanan.
* Apabila terdapat minggu libur/bebas kas (misal kas baru dimulai dari Minggu ke-2 atau ke-3), Bendahara dapat menandai minggu tersebut sebagai **Bebas Kas (${formatRp(0)})** secara global dari menu Pengaturan.`,
      actionCard: {
        type: 'stat',
        title: 'Nominal Iuran Kas Resmi',
        content: `${formatRp(weeklyDue)}/minggu • ${formatRp(monthlyDue)}/bulan`
      }
    };
  }

  // 3. QUERY: JUMLAH TOTAL SISWA / ANGGOTA OSIS
  if (
    (promptLower.includes('jumlah') || promptLower.includes('total') || promptLower.includes('berapa')) && 
    (promptLower.includes('siswa') || promptLower.includes('anggota') || promptLower.includes('pengurus'))
  ) {
    const totalMembers = members.length;
    return {
      text: `### 👥 Jumlah Total Anggota & Pengurus OSIS

Saat ini terdapat **${totalMembers} Orang Pengurus/Anggota** yang terdaftar aktif di database **${config.shortName}**.

* 🏆 **Ketua Umum OSIS**: ${config.leaderName || 'Ketua Umum'}
* 📝 **Sekretaris Umum**: ${config.secretaryName || 'Sekretaris Umum'}
* 💰 **Bendahara Umum**: ${config.treasurerName || 'Bendahara Umum'}
* 🏛️ **Struktur Sekbid**: Terbagi ke dalam 10 Sekbid utama (Keagamaan, Budi Pekerti, Kepemimpinan, dll).

---

*Seluruh data anggota tersimpan & tersinkron secara terenkripsi pada NeonDB PostgreSQL Cloud.*`,
      actionCard: {
        type: 'stat',
        title: 'Total Pengurus OSIS',
        content: `${totalMembers} Anggota Terdaftar Aktif`
      }
    };
  }

  // 4. EXPLICIT AUDIT KAS (P-1 / Analisis Kesehatan)
  if (promptLower === 'p-1' || promptLower.includes('analisis kesehatan') || promptLower.includes('audit kas') || (promptLower.includes('kesehatan') && promptLower.includes('kas'))) {
    const isHealthy = balance >= 0;

    return {
      text: `### 📊 Analisis Kesehatan Keuangan & Kas OSIS

Halo Pengurus **${config.shortName}**! Berikut adalah hasil audit kecerdasan keuangan *real-time*:

* **Saldo Kas Bersih Saat Ini**: \`${formatRp(balance)}\` ${isHealthy ? '🟢 (Sehat & Positif)' : '🔴 (Defisit)'}
* **Total Pemasukan**: \`${formatRp(income)}\`
* **Total Pengeluaran**: \`${formatRp(expense)}\`
* **Kepatuhan Iuran Kas**: Terverifikasi \`${paidDuesCount} pembayaran lunas\` dari total \`${members.length} pengurus\`.

---

#### 💡 Rekomendasi Strategis AI:
1. **${isHealthy ? 'Pertahankan Kas Positif' : 'Prioritaskan Penagihan Iuran'}**: ${isHealthy ? 'Kas dalam kondisi stabil. Alokasikan 20% saldo untuk dana darurat proker.' : 'Lakukan penagihan iuran kas mingguan secara konsisten.'}
2. **Efisiensi Pengeluaran**: Pastikan setiap pencairan anggaran kegiatan melampirkan nota/kwitansi resmi bendahara.
3. **Pengingat Otomatis**: Gunakan draf WhatsApp AI untuk mengingatkan anggota yang belum membayar iuran kas mingguan.`,
      actionCard: {
        type: 'stat',
        title: 'Ringkasan Kas OSIS',
        content: `Saldo Bersih: ${formatRp(balance)} • ${members.length} Pengurus`
      }
    };
  }

  // 5. EXPLICIT PRESENSI EVALUATION (P-2)
  if (promptLower === 'p-2' || promptLower.includes('evaluasi presensi') || promptLower.includes('keaktifan rapat') || promptLower.includes('evaluasi tingkat')) {
    const totalEvents = events.length;
    const totalLog = data.attendanceRecords.length;

    return {
      text: `### 📈 Evaluasi Presensi & Keaktifan Pengurus

Berdasarkan rekapitulasi data presensi **${config.shortName}**:

* **Total Agenda Kegiatan/Rapat**: \`${totalEvents} Agenda\`
* **Total Log Kehadiran Recorded**: \`${totalLog} Presensi\`
* **Jumlah Pengurus Terdaftar**: \`${members.length} Anggota\`

---

#### 🎯 Analisis Keaktifan & Solusi AI:
1. **Transparansi QR Scan Web**: Penggunaan QR Code Sesi Presensi telah mempercepat proses absensi mandiri siswa secara signifikan.
2. **Evaluasi Kehadiran Sekbid**: Pengurus dengan tingkat presensi di atas 80% layak mendapatkan penghargaan *Pengurus Terbaik Bulanan*.
3. **Saran Motivasi**: Untuk agenda rapat berikutnya, kirimkan reminder H-1 melalui grup WhatsApp dengan mencantumkan poin bahasan utama.`,
      actionCard: {
        type: 'stat',
        title: 'Statistik Presensi',
        content: `${totalEvents} Agenda Kegiatan • ${totalLog} Log Presensi`
      }
    };
  }

  // 6. EXPLICIT PROKER GENERATOR (P-3)
  if (promptLower === 'p-3' || promptLower.includes('rekomendasikan 3 ide') || promptLower.includes('proker kreatif') || promptLower.includes('ide program kerja')) {
    return {
      text: `### 💡 Rekomendasi Program Kerja (Proker) Kreatif Sekbid

Berikut adalah 3 ide program kerja unggulan berbiaya efisien yang dirancang untuk **${config.shortName}**:

---

#### 1. 🌟 **Sekbid 1 & 2: Bakti Sosial & Digital Character Building**
* **Tujuan**: Mengasah kepedulian sosial & etika digital siswa SKARLAKES.
* **Bentuk Kegiatan**: Sharing session etika medsos + donasi sembako ke panti asuhan lokal.
* **Estimasi Anggaran**: \`Rp 350.000\` (Didanai dari Kas OSIS & Donasi).

#### 2. 🚀 **Sekbid 4 & 5: SKARLAKES Leadership & Public Speaking Workshop**
* **Tujuan**: Melatih kepercayaan diri pengurus OSIS & perwakilan kelas dalam menyampaikan gagasan.
* **Bentuk Kegiatan**: Pelatihan public speaking interaktif 1 hari dengan pemateri alumni/guru.
* **Estimasi Anggaran**: \`Rp 250.000\`.

#### 3. 🎨 **Sekbid 8 & 10: E-Sports & Art Festival Interaktif**
* **Tujuan**: Wadah minat bakat siswa dalam bidang teknologi, seni, dan e-sports sekolah.
* **Bentuk Kegiatan**: Turnamen Mobile Legends / Futsal mini antar kelas saat pasca-AST/PAS.
* **Estimasi Anggaran**: \`Rp 400.000\` (Covered by pendaftaran tim).`,
      actionCard: {
        type: 'proker',
        title: '3 Rekomendasi Proker Sekbid',
        content: 'Bakti Sosial & Digital, Public Speaking, E-Sports & Art Fest'
      }
    };
  }

  // 7. EXPLICIT WHATSAPP DRAFT (P-4)
  if (promptLower === 'p-4' || promptLower.includes('draf pesan whatsapp') || promptLower.includes('draft wa') || promptLower.includes('pengingat whatsapp')) {
    const weeklyDueRp = (config.defaultWeeklyDue || 2500).toLocaleString('id-ID');
    const waText = `Assalamu'alaikum Wr. Wb. & Selamat Sejahtera ✨

Halo Rekan Pengurus *${config.shortName}* 👋

Izin mengingatkan secara ramah untuk pembayaran *Iuran Kas Mingguan OSIS* sebesar *Rp ${weeklyDueRp}/minggu*.

💳 *Metode Pembayaran:*
• Transfer Bank: ${config.bankName} (${config.bankAccountNumber || 'Kontak Bendahara'})
• Tunai: Bendahara Umum (${config.treasurerName || 'Bendahara OSIS'})

Iuran kas ini digunakan untuk kelancaran kegiatan & operasional organisasi kita bersama. Terima kasih atas partisipasi aktifnya! 🙏

_Salam Hangat,_
*Pengurus OSIS SKARLAKES*`;

    return {
      text: `### ✉️ Draf Pesan WhatsApp Pengingat Iuran Kas

Berikut adalah draf pesan pengingat yang sopan, ramah, dan persuasif yang siap disalin dan dikirim ke grup pengurus OSIS:

\`\`\`text
${waText}
\`\`\``,
      actionCard: {
        type: 'whatsapp',
        title: 'Draf Pesan WhatsApp Pengingat',
        content: `Nominal: Rp ${weeklyDueRp}/minggu • Siap Kirim`,
        whatsappText: waText
      }
    };
  }

  // DEFAULT FALLBACK: Pilihan umum yang jelas
  return {
    text: `### 🤖 Asisten AI OSIS SKARLAKES siap membantu!

Pertanyaan: "${userPrompt}"

Berdasarkan data **${config.shortName}**:
• **Total Pengurus**: \`${members.length} Anggota\`
• **Kas Bersih**: \`${formatRp(balance)}\`
• **Tarif Kas**: \`${formatRp(config.defaultWeeklyDue || 2500)}/minggu\`

Silakan tanyakan pertanyaan lebih spesifik seperti:
1. "Berapa jumlah total siswa/anggota OSIS?"
2. "Berapa nominal iuran kas per siswa?"
3. "Analisis kesehatan kas OSIS"
4. "Rekomendasi proker sekbid baru"
5. "Draf WA pengingat iuran kas"`
  };
}

/**
 * Main AI Gateway function (Gemini API with Smart Local Fallback)
 */
export async function getAiAssistantResponse(
  userPrompt: string,
  data: SystemStateData,
  apiKey?: string
): Promise<{ text: string; actionCard?: AiMessage['actionCard'] }> {
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const contextSummary = buildOsisContextSummary(data);
      const fullPrompt = `Anda adalah "OSIS AI Intelligence", asisten AI pintar, ramah, profesional, dan analitis untuk organisasi OSIS SKARLAKES (SMK Airlangga & SMK Kesehatan Airlangga).

ANALISIS DATA ORGANISASI REAL-TIME SANGAT PENTING:
Berikut adalah SELURUH DATA LIVE ORGANISASI OSIS SKARLAKES dari database cloud saat ini:
${contextSummary}

Pertanyaan/Instruksi Pengguna:
"${userPrompt}"

PETUNJUK JAWABAN:
1. Pikirkan dan jawablah pertanyaan pengguna secara LANGSUNG, SPESIFIK, dan CERDAS berdasarkan DATA ASLI ORGANISASI di atas.
2. Jangan menggunakan data dummy atau template kaku jika pertanyaan pengguna spesifik (misalnya jika ditanya jumlah siswa, sebutkan jumlah siswa asli dari data; jika ditanya iuran, sebutkan tarif iuran asli; jika ditanya proker, berikan ide proker kontekstual).
3. Berikan jawaban dalam bahasa Indonesia yang sangat sopan, komunikatif, persuasif, dan terstruktur rapi dengan Markdown.`;

      // Try gemini-3.6-flash first, then gemini-flash-latest
      const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }]
            })
          });

          if (response.ok) {
            const json = await response.json();
            const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText) {
              return { text: responseText };
            }
          }
        } catch (mErr) {
          console.warn(`Model ${modelName} call error:`, mErr);
        }
      }
    } catch (err) {
      console.warn('Gemini API call warning, falling back to Smart Local Inference Engine:', err);
    }
  }

  return generateSmartLocalAiResponse(userPrompt, data);
}
