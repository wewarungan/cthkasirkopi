import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format Currency IDR as plain number
 */
const formatRupiahNum = (val) => Number(val || 0);

/**
 * Format Currency IDR as display string
 */
const formatRupiahStr = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
};

/**
 * Helper to apply thousands separator formatting (#,##0)
 * to numeric cells in SheetJS while preserving raw number type for =SUM()
 */
const applyThousandFormatToWorksheet = (ws) => {
  Object.keys(ws).forEach((cellKey) => {
    if (cellKey.startsWith('!')) return;
    const cell = ws[cellKey];
    if (cell && cell.t === 'n') {
      cell.z = '#,##0'; // Excel standard thousands separator format
    }
  });
};

/**
 * Export complete multi-sheet Excel (.xlsx) file
 * Numbers are raw numeric with '#,##0' formatting so Excel renders e.g. 30.000
 * and =SUM(...) functions accurately!
 */
export function exportReportToExcel({
  settings,
  periodLabel,
  dateRangeStr,
  currentUser,
  summary,
  transactions = [],
  expenses = [],
  topProducts = [],
  paymentStats,
  peakHourData,
  orderTypeStats
}) {
  const isOwner = currentUser?.role === 'owner';
  const storeName = settings?.storeName || 'KOPI KITA';
  const now = new Date();
  const printDateStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: RINGKASAN FINANSIAL & ARUS KAS
  // ==========================================
  const summaryRows = [
    ['LAPORAN KEUANGAN & OPERASIONAL KEDAI KOPI'],
    [storeName.toUpperCase()],
    [`Alamat: ${settings?.storeAddress || '-'} | Telp: ${settings?.storePhone || '-'}`],
    [''],
    ['INFORMASI LAPORAN'],
    ['Periode', periodLabel],
    ['Rentang Tanggal', dateRangeStr || '-'],
    ['Tanggal Dibuat', printDateStr],
    ['Dibuat Oleh', `${currentUser?.name || 'Kasir'} (${currentUser?.role || 'kasir'})`],
    [''],
    ['1. RINGKASAN OMSET PENJUALAN'],
    ['Total Penjualan Kotor (Subtotal)', formatRupiahNum(summary.subtotal)],
    ['Total Diskon Penjualan', formatRupiahNum(summary.totalDiscount)],
    ['Total Omset Bersih (Net Sales)', formatRupiahNum(summary.totalOmzet)],
    ['Total Transaksi Selesai', transactions.length],
    ['Rata-rata Nilai Belanja (Basket Size)', transactions.length > 0 ? Math.round(summary.totalOmzet / transactions.length) : 0],
    [''],
    ['2. ARUS KAS & SALDO LACI KASIR'],
    ['Penjualan Tunai (Cash Masuk Laci)', formatRupiahNum(paymentStats?.cashTotal || 0)],
    ['Pengeluaran Kas Kecil (Kas Keluar)', -formatRupiahNum(summary.totalExpense || 0)],
    ['Estimasi Fisik Uang di Laci', formatRupiahNum((paymentStats?.cashTotal || 0) - (summary.totalExpense || 0))],
    ['Penjualan Non-Tunai (QRIS / Transfer Bank)', formatRupiahNum(paymentStats?.cashlessTotal || 0)],
    [''],
    ['3. PERBANDINGAN METODE BAYAR & TIPE PESANAN'],
    ['Porsi Pembayaran QRIS / Non-Tunai', `${paymentStats?.cashlessPercent || 0}% (${paymentStats?.cashlessCount || 0} transaksi)`],
    ['Porsi Pembayaran Tunai (Cash)', `${paymentStats?.cashPercent || 0}% (${paymentStats?.cashCount || 0} transaksi)`],
    ['Pesanan Minum di Tempat (Dine In)', `${orderTypeStats?.dineInPercent || 0}% (${orderTypeStats?.dineInCount || 0} pesanan)`],
    ['Pesanan Bungkus Bawa Pulang (Take Away)', `${orderTypeStats?.takeAwayPercent || 0}% (${orderTypeStats?.takeAwayCount || 0} pesanan)`],
    [''],
    ['4. WAKTU PENJUALAN TERSENSIF (PEAK HOURS)'],
    ['Jam Paling Ramai (Puncak Transaksi)', peakHourData?.timeSlot || '-'],
    ['Jumlah Transaksi pada Jam Sibuk', `${peakHourData?.count || 0} transaksi`],
    ['Omset pada Jam Sibuk', formatRupiahNum(peakHourData?.revenue || 0)],
  ];

  // Khusus Owner: Tambahkan Bagian Laba Bersih & Modal HPP
  if (isOwner) {
    summaryRows.push(
      [''],
      ['5. RAHASIA LABA BERSIH (KHUSUS OWNER)'],
      ['Total Modal Bahan Baku (HPP)', formatRupiahNum(summary.totalCost)],
      ['Laba Kotor Kedai (Gross Profit)', formatRupiahNum(summary.grossProfit)],
      ['Persentase Margin Laba Kotor', `${summary.profitMargin || 0}%`],
      ['Total Biaya Operasional Kas Keluar', formatRupiahNum(summary.totalExpense)],
      ['Laba Bersih Operasional Toko', formatRupiahNum(summary.netProfit)]
    );
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  applyThousandFormatToWorksheet(wsSummary);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // ==========================================
  // SHEET 2: DAFTAR TRANSAKSI
  // ==========================================
  const txHeader = [
    'No',
    'No Invoice',
    'Tanggal',
    'Jam',
    'Kasir',
    'Pelanggan',
    'Tipe Pesanan',
    'Jumlah Item',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Total Bayar (Rp)',
    'Metode Bayar',
    'Tunai Diberikan (Rp)',
    'Kembalian (Rp)'
  ];

  const txRows = transactions.map((tx, idx) => [
    idx + 1,
    tx.invoiceNumber,
    tx.date,
    tx.time?.slice(0, 5) || '-',
    tx.cashier || 'Kasir',
    tx.customerName || 'Pelanggan',
    tx.orderType || 'Dine In',
    tx.items?.reduce((sum, item) => sum + (item.qty || 1), 0) || 0,
    formatRupiahNum(tx.subtotal || tx.total),
    formatRupiahNum(tx.discount || 0),
    formatRupiahNum(tx.total),
    tx.paymentMethod,
    tx.paymentMethod === 'Tunai' ? formatRupiahNum(tx.amountPaid) : formatRupiahNum(tx.total),
    tx.paymentMethod === 'Tunai' ? formatRupiahNum(tx.changeAmount) : 0
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  applyThousandFormatToWorksheet(wsTx);
  wsTx['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 15 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

  // ==========================================
  // SHEET 3: PENJUALAN PER MENU KOPI
  // ==========================================
  const menuHeader = isOwner 
    ? ['No', 'Nama Menu', 'Kategori', 'Harga Jual (Rp)', 'Modal HPP (Rp)', 'Jumlah Terjual (Qty)', 'Total Omset (Rp)', 'Total Laba (Rp)', 'Margin %']
    : ['No', 'Nama Menu', 'Kategori', 'Harga Jual (Rp)', 'Jumlah Terjual (Qty)', 'Total Omset (Rp)'];

  const menuRows = topProducts.map((prod, idx) => {
    const qty = prod.qty || 0;
    const rev = prod.totalRevenue || (prod.price * qty);
    const cost = prod.cost || 0;
    const profit = prod.totalProfit || ((prod.price - cost) * qty);
    const margin = prod.price > 0 ? Math.round(((prod.price - cost) / prod.price) * 100) : 0;

    if (isOwner) {
      return [
        idx + 1,
        prod.name,
        prod.category || '-',
        formatRupiahNum(prod.price),
        formatRupiahNum(cost),
        qty,
        formatRupiahNum(rev),
        formatRupiahNum(profit),
        `${margin}%`
      ];
    }

    return [
      idx + 1,
      prod.name,
      prod.category || '-',
      formatRupiahNum(prod.price),
      qty,
      formatRupiahNum(rev)
    ];
  });

  const wsMenu = XLSX.utils.aoa_to_sheet([menuHeader, ...menuRows]);
  applyThousandFormatToWorksheet(wsMenu);
  wsMenu['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    ...(isOwner ? [{ wch: 16 }] : []),
    { wch: 20 },
    { wch: 18 },
    ...(isOwner ? [{ wch: 18 }, { wch: 12 }] : [])
  ];
  XLSX.utils.book_append_sheet(wb, wsMenu, 'Penjualan Menu');

  // ==========================================
  // SHEET 4: RIWAYAT KAS KELUAR (PETTY CASH)
  // ==========================================
  const expHeader = ['No', 'ID Catatan', 'Tanggal', 'Jam', 'Kategori Pengeluaran', 'Keterangan / Keperluan', 'Nominal (Rp)', 'Dicatat Oleh'];
  const expRows = expenses.map((exp, idx) => [
    idx + 1,
    exp.id,
    exp.date,
    exp.time || '-',
    exp.category || 'Operasional',
    exp.note || '-',
    formatRupiahNum(exp.amount),
    exp.recordedBy || 'Kasir'
  ]);

  const wsExp = XLSX.utils.aoa_to_sheet([expHeader, ...expRows]);
  applyThousandFormatToWorksheet(wsExp);
  wsExp['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 12 },
    { wch: 8 },
    { wch: 22 },
    { wch: 32 },
    { wch: 16 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsExp, 'Kas Keluar');

  // Generate file name
  const cleanStore = storeName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_${cleanStore}_${cleanPeriod}_${now.toISOString().split('T')[0]}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, fileName);
}

/**
 * Direct PDF Download (1-Click Download without opening print window)
 */
export function exportReportToPdf({
  settings,
  periodLabel,
  dateRangeStr,
  currentUser,
  summary,
  transactions = [],
  expenses = [],
  topProducts = [],
  paymentStats,
  peakHourData,
  orderTypeStats
}) {
  const isOwner = currentUser?.role === 'owner';
  const storeName = settings?.storeName || 'KOPI KITA';
  const now = new Date();
  const printDateStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

  // Initialize jsPDF A4 portrait
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [92, 58, 33]; // #5c3a21 Coffee Brown
  const secondaryColor = [60, 40, 25];
  const darkTextColor = [30, 25, 20];

  // 1. KOP SURAT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text(storeName.toUpperCase(), 14, 18);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (settings?.storeSlogan) {
    doc.text(settings.storeSlogan, 14, 23);
  }
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings?.storeAddress || 'Jl. Kopi Kenangan No. 42'}  •  Telp: ${settings?.storePhone || '-'}`, 14, 28);

  // Divider line
  doc.setDrawColor(92, 58, 33);
  doc.setLineWidth(0.8);
  doc.line(14, 32, 196, 32);

  // 2. JUDUL DOKUMEN & INFO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkTextColor);
  doc.text('LAPORAN KEUANGAN & OPERASIONAL KEDAI', 14, 39);

  // Info Box
  autoTable(doc, {
    startY: 42,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1, textColor: [60, 60, 60] },
    columnStyles: {
      0: { fontStyle: 'bold', width: 28 },
      1: { width: 68 },
      2: { fontStyle: 'bold', width: 28 },
      3: { width: 68 }
    },
    body: [
      ['Periode', `: ${periodLabel}`, 'Tanggal Cetak', `: ${printDateStr}`],
      ['Rentang Tanggal', `: ${dateRangeStr || '-'}`, 'Dibuat Oleh', `: ${currentUser?.name || 'Kasir'} (${currentUser?.role})`]
    ]
  });

  let currentY = doc.lastAutoTable.finalY + 4;

  // 3. RINGKASAN FINANSIAL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('1. RINGKASAN FINANSIAL & ARUS KAS', 14, currentY);

  const finBody = [
    ['Total Omset Penjualan (Net Sales)', formatRupiahStr(summary.totalOmzet), 'Penjualan Tunai (Cash Masuk Laci)', formatRupiahStr(paymentStats?.cashTotal || 0)],
    ['Total Transaksi Selesai', `${transactions.length} transaksi`, 'Pengeluaran Kas Kecil (Kas Keluar)', `- ${formatRupiahStr(summary.totalExpense || 0)}`],
    ['Rata-rata Belanja (Basket Size)', formatRupiahStr(transactions.length > 0 ? Math.round(summary.totalOmzet / transactions.length) : 0), 'ESTIMASI FISIK UANG DI LACI', formatRupiahStr((paymentStats?.cashTotal || 0) - (summary.totalExpense || 0))],
    ['Total Non-Tunai (QRIS / Bank)', formatRupiahStr(paymentStats?.cashlessTotal || 0), 'Porsi Pembayaran', `QRIS ${paymentStats?.cashlessPercent || 0}%  •  Tunai ${paymentStats?.cashPercent || 0}%`]
  ];

  if (isOwner) {
    finBody.push(
      ['Total Modal Bahan Baku (HPP)', formatRupiahStr(summary.totalCost), 'Laba Kotor (Gross Profit)', `${formatRupiahStr(summary.grossProfit)} (${summary.profitMargin}%)`],
      ['Total Biaya Kas Keluar', formatRupiahStr(summary.totalExpense), 'LABA BERSIH KEDAI (NET PROFIT)', formatRupiahStr(summary.netProfit)]
    );
  }

  autoTable(doc, {
    startY: currentY + 2,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 245, 240], width: 55 },
      1: { width: 40 },
      2: { fontStyle: 'bold', fillColor: [248, 245, 240], width: 55 },
      3: { width: 40 }
    },
    body: finBody
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 4. INSIGHT CAFE (PEAK HOURS & METODE BAYAR)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('2. INSIGHT OPERASIONAL KEDAI', 14, currentY);

  autoTable(doc, {
    startY: currentY + 2,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 45, fillColor: [254, 243, 199] },
      1: { width: 145 }
    },
    body: [
      ['Jam Paling Ramai (Peak Hours)', `${peakHourData?.timeSlot || '-'}  (Puncak: ${peakHourData?.count || 0} order, Omset: ${formatRupiahStr(peakHourData?.revenue || 0)})`],
      ['Tipe Pesanan Pelanggan', `Minum di Tempat (Dine In): ${orderTypeStats?.dineInPercent || 0}% (${orderTypeStats?.dineInCount || 0} cup)   •   Bungkus (Take Away): ${orderTypeStats?.takeAwayPercent || 0}% (${orderTypeStats?.takeAwayCount || 0} cup)`]
    ]
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 5. TOP 5 MENU PALING LARIS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('3. PERINGKAT PRODUK TERLARIS (TOP 5 MENU)', 14, currentY);

  const topHeaders = isOwner
    ? [['#', 'Nama Menu', 'Kategori', 'Harga Jual', 'Modal HPP', 'Terjual', 'Total Omset', 'Total Laba']]
    : [['#', 'Nama Menu', 'Kategori', 'Harga Jual', 'Terjual', 'Total Omset']];

  const topRows = topProducts.slice(0, 5).map((prod, idx) => {
    const qty = prod.qty || 0;
    const rev = prod.totalRevenue || (prod.price * qty);
    const cost = prod.cost || 0;
    const profit = prod.totalProfit || ((prod.price - cost) * qty);

    if (isOwner) {
      return [
        idx + 1,
        prod.name,
        prod.category || '-',
        formatRupiahStr(prod.price),
        formatRupiahStr(cost),
        `${qty} cup`,
        formatRupiahStr(rev),
        formatRupiahStr(profit)
      ];
    }

    return [
      idx + 1,
      prod.name,
      prod.category || '-',
      formatRupiahStr(prod.price),
      `${qty} cup`,
      formatRupiahStr(rev)
    ];
  });

  autoTable(doc, {
    startY: currentY + 2,
    theme: 'striped',
    head: topHeaders,
    body: topRows.length > 0 ? topRows : [['-', 'Belum ada produk terjual', '-', '-', '-', '-']],
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', width: 8 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // Check if page needs page break for signatures
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // 6. LEMBAR PENGESAHAN (TANDA TANGAN RESMI)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, currentY, 196, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  doc.text('Dibuat & Dilaporkan Oleh,', 30, currentY);
  doc.text('Disetujui & Diterima Oleh,', 140, currentY);

  currentY += 20;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(currentUser?.name || 'Kasir Kedai', 30, currentY);
  doc.text('( ............................................ )', 140, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Kasir / Admin Operasional', 30, currentY + 4);
  doc.text('Pemilik Kedai (Owner)', 140, currentY + 4);

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Dokumen ini diunduh otomatis via Aplikasi Kasir Kopi • Sah sebagai arsip pembukuan internal.', 14, 288);

  // Generate file name & save
  const cleanStore = storeName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_${cleanStore}_${cleanPeriod}_${now.toISOString().split('T')[0]}.pdf`;

  doc.save(fileName);
}
