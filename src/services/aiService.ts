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
 * Builds live context summary for OSIS AI
 */
export function buildOsisContextSummary(data: SystemStateData): string {
  const { config, members, events, attendanceRecords, transactions, duesRecords } = data;
  
  const income = transactions.filter(t => t.type.toLowerCase() === 'pemasukan').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const expense = transactions.filter(t => t.type.toLowerCase() === 'pengeluaran').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance = income - expense;
  const paidDuesCount = duesRecords.filter(d => d.status === 'lunas').length;

  return `
[DATA ORGANISASI REAL-TIME OSIS SKARLAKES]
Nama Organisasi: ${config.name} (${config.shortName})
Periode: ${config.period}
Jumlah Total Anggota OSIS: ${members.length} Orang
Ketua Umum: ${config.leaderName || 'Ketua Umum OSIS'}
Sekretaris Umum: ${config.secretaryName || 'Sekretaris Umum'}
Bendahara Umum: ${config.treasurerName || 'Bendahara Umum'}

[STATISTIK KEUANGAN & KAS]
Total Pemasukan Kas: Rp ${income.toLocaleString('id-ID')}
Total Pengeluaran Kas: Rp ${expense.toLocaleString('id-ID')}
Saldo Kas Bersih Saat Ini: Rp ${balance.toLocaleString('id-ID')}
Nominal Iuran Mingguan: Rp ${(config.defaultWeeklyDue || 2500).toLocaleString('id-ID')} / minggu
Total Catatan Iuran Terverifikasi Lunas: ${paidDuesCount} catatan

[STATISTIK PRESENSI & KEGIATAN]
Total Kegiatan/Rapat Tercatat: ${events.length} Kegiatan
Total Log Presensi: ${attendanceRecords.length} Data Hadir/Izin/Sakit
`;
}

/**
 * Smart Fallback Local AI Inference Engine (Instant 0ms, 100% Reliable Offline)
 */
export function generateSmartLocalAiResponse(userPrompt: string, data: SystemStateData): { text: string; actionCard?: AiMessage['actionCard'] } {
  const promptLower = userPrompt.toLowerCase();
  const { config, members, transactions, duesRecords, events } = data;

  const income = transactions.filter(t => t.type.toLowerCase() === 'pemasukan').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const expense = transactions.filter(t => t.type.toLowerCase() === 'pengeluaran').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance = income - expense;
  const paidDuesCount = duesRecords.filter(d => d.status === 'lunas').length;

  // 1. FINANCIAL AUDIT AI
  if (promptLower.includes('keuangan') || promptLower.includes('kas') || promptLower.includes('kesehatan') || promptLower.includes('p-1')) {
    const isHealthy = balance >= 0;
    const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

    return {
      text: `### 📊 Analisis Kesehatan Keuangan & Kas OSIS

Halo Pengurus **${config.shortName}**! Berikut adalah hasil audit & analisis kecerdasan keuangan *real-time*:

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

  // 2. ATTENDANCE & PARTICIPATION ANALYST AI
  if (promptLower.includes('presensi') || promptLower.includes('kehadiran') || promptLower.includes('keaktifan') || promptLower.includes('p-2')) {
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

  // 3. PROKER GENERATOR AI
  if (promptLower.includes('proker') || promptLower.includes('kreatif') || promptLower.includes('ide') || promptLower.includes('p-3')) {
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

  // 4. WHATSAPP DRAFT AI
  if (promptLower.includes('wa') || promptLower.includes('whatsapp') || promptLower.includes('pengingat') || promptLower.includes('draft') || promptLower.includes('p-4')) {
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

  // DEFAULT / GENERAL RESPONSE
  return {
    text: `### 🤖 Asisten AI OSIS SKARLAKES siap membantu!

Saya adalah Asisten Cerdas Pintar yang terintegrasi langsung dengan database **${config.shortName}**.

Anda dapat menanyakan hal-hal berikut:
1. **"Analisis kesehatan kas OSIS"**
2. **"Evaluasi presensi rapat anggota"**
3. **"Rekomendasi proker sekbid baru"**
4. **"Draf WA pengingat iuran kas"**

Silakan pilih salah satu tombol prompt cepat di bawah atau ketik pertanyaan Anda!`
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
      const fullPrompt = `Anda adalah "OSIS AI Intelligence", asisten AI pintar, ramah, profesional, dan cerdas untuk organisasi OSIS SKARLAKES (SMK Airlangga & SMK Kesehatan Airlangga).

Gunakan data organisasi berikut untuk memberikan jawaban presisi:
${contextSummary}

Pertanyaan/Instruksi Pengguna:
"${userPrompt}"

Berikan jawaban dalam bahasa Indonesia yang sangat sopan, terstruktur dengan rapi menggunakan Github Markdown, dan berikan rekomendasi aksi konkret.`;

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
