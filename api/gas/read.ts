export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', error: 'Method not allowed' });
  }

  const webhookUrl = req.query?.webhookUrl as string;
  const action = (req.query?.action as string) || 'readAll';

  if (!webhookUrl) {
    return res.status(400).json({ status: 'error', error: 'Parameter webhookUrl diperlukan.' });
  }

  try {
    const targetUrl = new URL(webhookUrl);
    targetUrl.searchParams.set('action', action);

    const gasResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
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
      return res.status(200).json({ status: 'success', raw: responseText });
    }
  } catch (err: any) {
    console.error('Error reading from Google Apps Script:', err);
    return res.status(500).json({
      status: 'error',
      error: err.message || 'Gagal membaca data dari Google Apps Script',
    });
  }
}
