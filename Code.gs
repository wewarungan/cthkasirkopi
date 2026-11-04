/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - DATABASE LENGKAP KAFE (VERSI MULTI-DEVICE)
 * =========================================================================
 * 
 * FUNGSI:
 * 1. Sheet 'transaksi'    : Sinkronisasi riwayat penjualan (HP Kasir -> Laptop Owner)
 * 2. Sheet 'menu'         : Sinkronisasi katalog produk & harga antar semua alat
 * 3. Sheet 'pengeluaran'  : Catatan kas keluar / petty cash (es batu, galon, dll)
 * 4. Sheet 'meja_aktif'   : Meja aktif / Open Table (Tablet pelayan -> HP kasir)
 * 5. Sheet 'pengaturan'   : Profil kedai, Wi-Fi, dan QRIS
 * =========================================================================
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. SHEET TRANSAKSI
  let sheetTx = ss.getSheetByName('transaksi') || ss.insertSheet('transaksi');
  const txHeaders = [
    'Tanggal', 'Jam', 'No Invoice', 'Pelanggan / Meja', 'Tipe Pesanan',
    'Detail Pesanan (Menu & Qty)', 'Subtotal (Rp)', 'Diskon (Rp)', 'Total (Rp)',
    'Metode Bayar', 'Kasir', 'Status', 'Waktu Masuk Sistem'
  ];
  sheetTx.getRange(1, 1, 1, txHeaders.length).setValues([txHeaders])
    .setBackground('#5c3a21').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sheetTx.getRange('G2:I1000').setNumberFormat('Rp" "#,##0');
  sheetTx.setFrozenRows(1);
  for (let c = 1; c <= txHeaders.length; c++) sheetTx.autoResizeColumn(c);

  // 2. SHEET MENU
  let sheetMenu = ss.getSheetByName('menu') || ss.insertSheet('menu');
  const menuHeaders = ['ID Produk', 'Kategori', 'Nama Menu', 'Harga Jual (Rp)', 'Harga Modal HPP (Rp)', 'Foto URL', 'Status Stok', 'Best Seller', 'Baristas Choice'];
  sheetMenu.getRange(1, 1, 1, menuHeaders.length).setValues([menuHeaders])
    .setBackground('#846358').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sheetMenu.getRange('D2:E500').setNumberFormat('Rp" "#,##0');
  sheetMenu.setFrozenRows(1);
  if (sheetMenu.getLastRow() <= 1) {
    const starterMenus = [
      ['prod-1', 'es-kopi', 'Kopi Susu Kita', 18000, 8000, '', 'Tersedia', 'TRUE', 'FALSE'],
      ['prod-2', 'es-kopi', 'Latte Gula Aren', 24000, 10000, '', 'Tersedia', 'FALSE', 'TRUE'],
      ['prod-3', 'kopi-panas', 'Cappuccino', 22000, 9000, '', 'Tersedia', 'FALSE', 'FALSE'],
      ['prod-4', 'kopi-panas', 'Americano', 16000, 5000, '', 'Tersedia', 'FALSE', 'FALSE'],
      ['prod-5', 'non-kopi', 'Matcha Latte', 24000, 11000, '', 'Tersedia', 'FALSE', 'FALSE'],
      ['prod-6', 'non-kopi', 'Signature Chocolate', 22000, 9000, '', 'Tersedia', 'FALSE', 'FALSE'],
      ['prod-7', 'makanan', 'Pisang Goreng', 12000, 4000, '', 'Tersedia', 'FALSE', 'FALSE'],
      ['prod-8', 'makanan', 'Butter Croissant', 18000, 8500, '', 'Tersedia', 'TRUE', 'FALSE']
    ];
    sheetMenu.getRange(2, 1, starterMenus.length, starterMenus[0].length).setValues(starterMenus);
  }
  for (let c = 1; c <= menuHeaders.length; c++) sheetMenu.autoResizeColumn(c);

  // 3. SHEET PENGELUARAN (Kas Keluar / Petty Cash)
  let sheetExp = ss.getSheetByName('pengeluaran') || ss.insertSheet('pengeluaran');
  const expHeaders = ['ID Pengeluaran', 'Tanggal', 'Jam', 'Kategori', 'Keterangan', 'Jumlah (Rp)', 'Kasir / Pencatat'];
  sheetExp.getRange(1, 1, 1, expHeaders.length).setValues([expHeaders])
    .setBackground('#b91c1c').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sheetExp.getRange('F2:F1000').setNumberFormat('Rp" "#,##0');
  sheetExp.setFrozenRows(1);
  for (let c = 1; c <= expHeaders.length; c++) sheetExp.autoResizeColumn(c);

  // 4. SHEET MEJA AKTIF (Open Table)
  let sheetTables = ss.getSheetByName('meja_aktif') || ss.insertSheet('meja_aktif');
  const tableHeaders = ['ID Meja', 'Nomor Meja', 'Pelanggan', 'Waktu Masuk', 'Item Pesanan (JSON)', 'Total Sementara (Rp)', 'Kasir'];
  sheetTables.getRange(1, 1, 1, tableHeaders.length).setValues([tableHeaders])
    .setBackground('#d97706').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sheetTables.setFrozenRows(1);
  for (let c = 1; c <= tableHeaders.length; c++) sheetTables.autoResizeColumn(c);

  // 5. SHEET PENGATURAN
  let sheetSetting = ss.getSheetByName('pengaturan') || ss.insertSheet('pengaturan');
  const settingHeaders = ['Pengaturan', 'Nilai / Isi', 'Keterangan'];
  sheetSetting.getRange(1, 1, 1, settingHeaders.length).setValues([settingHeaders])
    .setBackground('#3d2b1f').setFontColor('#ffffff').setFontWeight('bold');
  sheetSetting.setFrozenRows(1);
  if (sheetSetting.getLastRow() <= 1) {
    const defaultSettings = [
      ['NAMA_KEDAI', 'Kopi Kita', 'Nama toko yang tercetak di struk'],
      ['SLOGAN', 'Warung Kopi Premium', 'Sub-judul di bawah nama toko'],
      ['ALAMAT', 'Jl. Merdeka No. 12', 'Alamat toko di struk'],
      ['NO_TELEPON', '0812-3456-7890', 'Nomor WhatsApp / telepon']
    ];
    sheetSetting.getRange(2, 1, defaultSettings.length, defaultSettings[0].length).setValues(defaultSettings);
  }

  // Bersihkan sheet default jika ada
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  sheetTx.activate();
  Logger.log('Setup Database Kafe Selesai!');
}

// -------------------------------------------------------------
// REST API (doGet & doPost)
// -------------------------------------------------------------

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e?.parameter?.action || 'PING';

  if (action === 'PING') {
    return createJsonResponse({ status: 'OK', message: 'Koneksi Database Kafe Aktif!' });
  }

  // 1. GET_TRANSACTIONS (Tarik data penjualan ke Laptop Owner)
  if (action === 'GET_TRANSACTIONS') {
    const sheet = ss.getSheetByName('transaksi');
    if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ status: 'OK', data: [] });
    const rows = sheet.getDataRange().getValues();
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      data.push({
        date: formatDateStr(rows[i][0]),
        time: String(rows[i][1]),
        invoiceNumber: String(rows[i][2]),
        customerName: rows[i][3],
        orderType: rows[i][4],
        itemsSummary: rows[i][5],
        subtotal: Number(rows[i][6]) || 0,
        discount: Number(rows[i][7]) || 0,
        total: Number(rows[i][8]) || 0,
        paymentMethod: rows[i][9],
        cashier: rows[i][10],
        status: rows[i][11] || 'Lunas'
      });
    }
    return createJsonResponse({ status: 'OK', data: data });
  }

  // 2. GET_MENU (Tarik menu & harga terbaru ke semua alat)
  if (action === 'GET_MENU') {
    const sheet = ss.getSheetByName('menu');
    if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ status: 'OK', data: [] });
    const rows = sheet.getDataRange().getValues();
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      data.push({
        id: String(rows[i][0]),
        categoryId: String(rows[i][1]),
        name: String(rows[i][2]),
        price: Number(rows[i][3]) || 0,
        costPrice: Number(rows[i][4]) || 0,
        imageUrl: String(rows[i][5] || ''),
        isAvailable: String(rows[i][6]).toLowerCase() !== 'habis',
        isBestSeller: String(rows[i][7]).toUpperCase() === 'TRUE',
        isBaristasChoice: String(rows[i][8]).toUpperCase() === 'TRUE'
      });
    }
    return createJsonResponse({ status: 'OK', data: data });
  }

  // 3. GET_EXPENSES (Tarik kas keluar ke laptop owner)
  if (action === 'GET_EXPENSES') {
    const sheet = ss.getSheetByName('pengeluaran');
    if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ status: 'OK', data: [] });
    const rows = sheet.getDataRange().getValues();
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      data.push({
        id: String(rows[i][0]),
        date: formatDateStr(rows[i][1]),
        time: String(rows[i][2]),
        category: rows[i][3],
        notes: rows[i][4],
        amount: Number(rows[i][5]) || 0,
        cashier: rows[i][6]
      });
    }
    return createJsonResponse({ status: 'OK', data: data });
  }

  // 4. GET_OPEN_TABLES (Tarik meja aktif ke HP/Tablet)
  if (action === 'GET_OPEN_TABLES') {
    const sheet = ss.getSheetByName('meja_aktif');
    if (!sheet || sheet.getLastRow() <= 1) return createJsonResponse({ status: 'OK', data: [] });
    const rows = sheet.getDataRange().getValues();
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      try {
        data.push({
          id: String(rows[i][0]),
          tableName: String(rows[i][1]),
          customerName: String(rows[i][2]),
          time: String(rows[i][3]),
          items: JSON.parse(rows[i][4] || '[]'),
          totalAmount: Number(rows[i][5]) || 0,
          cashier: String(rows[i][6])
        });
      } catch(e) {}
    }
    return createJsonResponse({ status: 'OK', data: data });
  }

  return createJsonResponse({ status: 'OK', message: 'Action tidak dikenali' });
}

function doPost(e) {
  try {
    const rawData = e?.postData?.contents;
    const body = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ADD_TRANSACTION (Kasir simpan transaksi)
    if (body.action === 'ADD_TRANSACTION') {
      let sheet = ss.getSheetByName('transaksi') || ss.insertSheet('transaksi');
      const tx = body.data;
      sheet.appendRow([
        tx.date || new Date().toISOString().split('T')[0],
        tx.time || Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm:ss'),
        tx.invoiceNumber,
        tx.customerName || 'Pelanggan',
        tx.orderType || 'Dine In',
        tx.itemsSummary || '',
        Number(tx.subtotal) || 0,
        Number(tx.discount) || 0,
        Number(tx.total) || 0,
        tx.paymentMethod || 'Tunai',
        tx.cashier || 'Kasir',
        'Lunas',
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      ]);
      return createJsonResponse({ success: true, message: 'Transaksi berhasil dicatat.' });
    }

    // 2. ADD_EXPENSE (Catat Kas Keluar)
    if (body.action === 'ADD_EXPENSE') {
      let sheet = ss.getSheetByName('pengeluaran') || ss.insertSheet('pengeluaran');
      const exp = body.data;
      sheet.appendRow([
        exp.id || 'EXP-' + Date.now(),
        exp.date || new Date().toISOString().split('T')[0],
        exp.time || Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm:ss'),
        exp.category || 'Operasional',
        exp.notes || '',
        Number(exp.amount) || 0,
        exp.cashier || 'Kasir'
      ]);
      return createJsonResponse({ success: true, message: 'Pengeluaran kas berhasil dicatat.' });
    }

    // 3. SYNC_MENU (Update Menu dari Owner ke Cloud)
    if (body.action === 'SYNC_MENU') {
      let sheet = ss.getSheetByName('menu') || ss.insertSheet('menu');
      const products = body.products || [];
      // Hapus data lama, pertahankan header
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
      if (products.length > 0) {
        const rows = products.map(p => [
          p.id,
          p.categoryId,
          p.name,
          Number(p.price) || 0,
          Number(p.costPrice) || 0,
          p.imageUrl || '',
          p.isAvailable !== false ? 'Tersedia' : 'Habis',
          p.isBestSeller ? 'TRUE' : 'FALSE',
          p.isBaristasChoice ? 'TRUE' : 'FALSE'
        ]);
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return createJsonResponse({ success: true, message: 'Katalog menu berhasil disinkronkan ke Cloud.' });
    }

    // 4. SYNC_OPEN_TABLES (Sinkron Meja Aktif antar HP & Tablet)
    if (body.action === 'SYNC_OPEN_TABLES') {
      let sheet = ss.getSheetByName('meja_aktif') || ss.insertSheet('meja_aktif');
      const tables = body.openTables || [];
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
      if (tables.length > 0) {
        const rows = tables.map(t => [
          t.id,
          t.tableName || 'Meja',
          t.customerName || '',
          t.time || '',
          JSON.stringify(t.items || []),
          Number(t.totalAmount) || 0,
          t.cashier || ''
        ]);
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return createJsonResponse({ success: true, message: 'Meja aktif berhasil disinkronkan.' });
    }

    return createJsonResponse({ success: false, message: 'Aksi tidak dikenal' });
  } catch(err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function formatDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
