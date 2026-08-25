export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', error: 'Method not allowed' });
  }

  const { webhookUrl, payload } = req.body || {};

  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return res.status(400).json({ status: 'error', error: 'Parameter webhookUrl diperlukan.' });
  }

  try {
    const gasResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const responseText = await gasResponse.text();

    if (
      responseText.includes('ServiceLogin') ||
      responseText.includes('accounts.google.com') ||
      responseText.includes('data-auto-init')
    ) {
      return res.status(401).json({
        status: 'error',
        error:
          'Akses Google Apps Script memerlukan otorisasi "Siapa saja (Anyone)". Saat deploy di Apps Script, pastikan memilih "Yang memiliki akses (Who has access)" -> "Siapa saja (Anyone)".',
        code: 'AUTH_REQUIRED_FOR_GAS',
      });
    }

    try {
      const parsedJson = JSON.parse(responseText);
      return res.status(200).json(parsedJson);
    } catch {
      return res.status(200).json({
        status: 'success',
        message: 'Tersinkronkan ke Google Apps Script',
        raw: responseText,
      });
    }
  } catch (err: any) {
    console.error('Error proxying to Google Apps Script:', err);
    return res.status(500).json({
      status: 'error',
      error: err.message || 'Gagal mengirim data ke Google Apps Script Web App',
    });
  }
}
