import * as XLSX from 'xlsx';

/**
 * Format Currency IDR
 */
const formatRupiahNum = (val) => Number(val || 0);

/**
 * Export complete multi-sheet Excel (.xlsx) file
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
  wsTx['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Invoice
    { wch: 12 }, // Tanggal
    { wch: 8 },  // Jam
    { wch: 16 }, // Kasir
    { wch: 18 }, // Pelanggan
    { wch: 14 }, // Tipe Pesanan
    { wch: 12 }, // Jml Item
    { wch: 15 }, // Subtotal
    { wch: 14 }, // Diskon
    { wch: 16 }, // Total Bayar
    { wch: 14 }, // Metode Bayar
    { wch: 18 }, // Tunai Diberikan
    { wch: 16 }  // Kembalian
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
