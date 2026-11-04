/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - DATABASE OTOMATIS APLIKASI KASIR KOPI
 * =========================================================================
 * 
 * CARA PAKAI PALING MUDAH (3 LANGKAH):
 * 1. Buka Google Sheets baru di Google Drive Anda (Beri nama: "Database Kasir Kopi").
 * 2. Klik menu "Ekstensi" > "Apps Script". Hapus kode lama, paste SEMUA kode ini.
 * 3. Di toolbar atas, pilih fungsi "setupDatabase", lalu klik tombol "Jalankan" (Run).
 *    -> SEMUA SHEET, KOLOM, WARNA & DATA CONTOH AKAN OTOMATIS DIBUATKAN!
 * 4. Untuk menghubungkan ke aplikasi web kasir:
 *    - Klik tombol "Terapkan" (Deploy) di kanan atas > "Penerapan Baru" (New Deployment).
 *    - Pilih jenis: "Aplikasi Web" (Web app).
 *    - Akses: Pilih "Siapa saja" (Anyone).
 *    - Klik "Terapkan", salin URL-nya (berakhiran /exec) dan tempel di Pengaturan aplikasi kasir!
 * =========================================================================
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. SHEET TRANSAKSI
  let sheetTx = ss.getSheetByName('transaksi');
  if (!sheetTx) {
    sheetTx = ss.insertSheet('transaksi');
  }
  
  const txHeaders = [
    'Tanggal', 'Jam', 'No Invoice', 'Pelanggan / Meja', 'Tipe Pesanan',
    'Detail Pesanan (Menu & Qty)', 'Subtotal (Rp)', 'Diskon (Rp)', 'Total (Rp)',
    'Metode Bayar', 'Kasir', 'Status', 'Waktu Masuk Sistem'
  ];
  
  sheetTx.getRange(1, 1, 1, txHeaders.length).setValues([txHeaders]);
  sheetTx.getRange(1, 1, 1, txHeaders.length)
    .setBackground('#5c3a21')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheetTx.getRange('G2:I1000').setNumberFormat('Rp" "#,##0');
  sheetTx.setFrozenRows(1);
  
  for (let col = 1; col <= txHeaders.length; col++) {
    sheetTx.autoResizeColumn(col);
  }

  // 2. SHEET MENU
  let sheetMenu = ss.getSheetByName('menu');
  if (!sheetMenu) {
    sheetMenu = ss.insertSheet('menu');
  }
  
  const menuHeaders = [
    'ID Produk', 'Kategori', 'Nama Menu', 'Harga Jual (Rp)', 'Harga Modal HPP (Rp)', 'Foto URL', 'Status Stok'
  ];
  
  sheetMenu.getRange(1, 1, 1, menuHeaders.length).setValues([menuHeaders]);
  sheetMenu.getRange(1, 1, 1, menuHeaders.length)
    .setBackground('#846358')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
    
  sheetMenu.getRange('D2:E500').setNumberFormat('Rp" "#,##0');
  sheetMenu.setFrozenRows(1);

  if (sheetMenu.getLastRow() <= 1) {
    const starterMenus = [
      ['prod-1', 'es-kopi', 'Kopi Susu Kita', 18000, 8000, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600', 'Tersedia'],
      ['prod-2', 'es-kopi', 'Latte Gula Aren', 24000, 10000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600', 'Tersedia'],
      ['prod-3', 'kopi-panas', 'Cappuccino', 22000, 9000, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600', 'Tersedia'],
      ['prod-4', 'kopi-panas', 'Americano', 16000, 5000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', 'Tersedia'],
      ['prod-5', 'non-kopi', 'Matcha Latte', 24000, 11000, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600', 'Tersedia'],
      ['prod-6', 'non-kopi', 'Signature Chocolate', 22000, 9000, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600', 'Tersedia'],
      ['prod-7', 'makanan', 'Pisang Goreng', 12000, 4000, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600', 'Tersedia'],
      ['prod-8', 'makanan', 'Butter Croissant', 18000, 8500, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600', 'Tersedia'],
    ];
    sheetMenu.getRange(2, 1, starterMenus.length, starterMenus[0].length).setValues(starterMenus);
  }

  for (let col = 1; col <= menuHeaders.length; col++) {
    sheetMenu.autoResizeColumn(col);
  }

  // 3. SHEET PENGATURAN
  let sheetSetting = ss.getSheetByName('pengaturan');
  if (!sheetSetting) {
    sheetSetting = ss.insertSheet('pengaturan');
  }
  
  const settingHeaders = ['Pengaturan', 'Nilai / Isi', 'Keterangan'];
  sheetSetting.getRange(1, 1, 1, settingHeaders.length).setValues([settingHeaders]);
  sheetSetting.getRange(1, 1, 1, settingHeaders.length)
    .setBackground('#3d2b1f')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheetSetting.setFrozenRows(1);

  if (sheetSetting.getLastRow() <= 1) {
    const defaultSettings = [
      ['NAMA_KEDAI', 'Kopi Kita', 'Nama toko yang tercetak di struk'],
      ['SLOGAN', 'Warung Kopi Premium', 'Sub-judul di bawah nama toko'],
      ['ALAMAT', 'Jl. Merdeka No. 12', 'Alamat toko di struk'],
      ['NO_TELEPON', '0812-3456-7890', 'Nomor WhatsApp / telepon'],
      ['WIFI_NAMA', 'KopiKita_Free', 'Nama SSID Wi-Fi pelanggan'],
      ['WIFI_PASSWORD', 'kopienak123', 'Password Wi-Fi di struk'],
      ['QRIS_MERCHANT', 'KOPI KITA COFFEE SHOP', 'Nama pemilik QRIS'],
      ['QRIS_IMAGE_URL', '', 'Link gambar QRIS di Google Drive'],
      ['FOOTER_STRUK', 'Terima kasih atas kunjungan Anda\n~ Kopi Kita ~', 'Pesan penutup di struk']
    ];
    sheetSetting.getRange(2, 1, defaultSettings.length, defaultSettings[0].length).setValues(defaultSettings);
  }

  for (let col = 1; col <= settingHeaders.length; col++) {
    sheetSetting.autoResizeColumn(col);
  }

  // 4. BERSIHKAN SHEET DEFAULT
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  sheetTx.activate();
  ss.setActiveSheet(sheetTx);
  ss.moveActiveSheet(1);

  Logger.log('✅ DATABASE KASIR KOPI BERHASIL DIBUAT!');
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'PING';

  if (action === 'PING') {
    return createJsonResponse({
      status: 'OK',
      message: 'Koneksi ke Google Sheets Kasir Kopi Berhasil Aktif!',
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'GET_TRANSACTIONS') {
    const sheetTx = ss.getSheetByName('transaksi');
    if (!sheetTx || sheetTx.getLastRow() <= 1) {
      return createJsonResponse({ status: 'OK', data: [] });
    }
    const rows = sheetTx.getDataRange().getValues();
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      data.push({
        date: rows[i][0],
        time: rows[i][1],
        invoiceNumber: rows[i][2],
        customerName: rows[i][3],
        orderType: rows[i][4],
        itemsSummary: rows[i][5],
        subtotal: rows[i][6],
        discount: rows[i][7],
        total: rows[i][8],
        paymentMethod: rows[i][9],
        cashier: rows[i][10],
        status: rows[i][11]
      });
    }
    return createJsonResponse({ status: 'OK', data: data });
  }

  return createJsonResponse({ status: 'OK', action: action });
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (body.action === 'ADD_TRANSACTION') {
      let sheetTx = ss.getSheetByName('transaksi');
      if (!sheetTx) {
        setupDatabase();
        sheetTx = ss.getSheetByName('transaksi');
      }

      const tx = body.data;
      sheetTx.appendRow([
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

      return createJsonResponse({
        success: true,
        message: 'Transaksi berhasil dicatat di Google Sheets',
        invoiceNumber: tx.invoiceNumber
      });
    }

    if (body.action === 'DELETE_TRANSACTION') {
      const sheetTx = ss.getSheetByName('transaksi');
      const invoiceToDelete = body.invoiceNumber;
      if (sheetTx && invoiceToDelete) {
        const rows = sheetTx.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (rows[i][2] === invoiceToDelete) {
            sheetTx.deleteRow(i + 1);
            return createJsonResponse({ success: true, message: 'Transaksi berhasil dihapus dari Google Sheets' });
          }
        }
      }
      return createJsonResponse({ success: false, message: 'Invoice tidak ditemukan' });
    }

    return createJsonResponse({ success: false, error: 'Aksi tidak dikenal' });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
