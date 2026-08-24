import QRCode from 'qrcode';

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  } catch {
    return dateStr;
  }
};

export const formatDateTimeIndo = (dateTimeStr: string): string => {
  if (!dateTimeStr) return '-';
  try {
    const [datePart, timePart] = dateTimeStr.split(' ');
    if (!timePart) return formatDateIndo(dateTimeStr);
    return `${formatDateIndo(datePart)}, ${timePart} WIB`;
  } catch {
    return dateTimeStr;
  }
};

export const getMonthName = (monthNumber: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthNumber - 1] || `Bulan ${monthNumber}`;
};

export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
};

export const exportToCSV = (filename: string, rows: (string | number)[][]) => {
  const csvContent = 'data:text/csv;charset=utf-8,' + 
    rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
