/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code_Master_Database.gs)
 * DATABASE PUSAT / MASTER LISENSI APLIKASI KASIR KOPI
 * =========================================================================
 * 
 * PANDUAN PENGGUNAAN (HANYA 3 MENIT):
 * 1. Buka Google Drive Anda > Buat Google Sheets Baru.
 *    Beri nama: "Master Database Kasir Kopi".
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua tulisan di sana, lalu PASTE SEMUA kode ini.
 * 4. Di toolbar atas, pilih fungsi "setupMasterDatabase" lalu klik "Jalankan" (Run).
 *    -> Tabel Master, kolom, warna, dan data contoh otomatis terbuat!
 * 5. Klik tombol "Terapkan" (Deploy) di kanan atas > "Penerapan Baru" (New Deployment).
 *    - Pilih jenis: "Aplikasi Web" (Web app).
 *    - Jalankan sebagai: "Saya" (Me).
 *    - Akses: "Siapa saja" (Anyone).
 *    - Klik "Terapkan" dan salin URL Web App-nya!
 * =========================================================================
 */

const SHEET_NAME = 'MASTER_KAFE';

/**
 * FUNGSI 1: setupMasterDatabase()
 * Jalankan fungsi ini sekali saja di awal untuk otomatis membuat tabel master yang rapi.
 */
function setupMasterDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Hapus sheet default jika ada
    const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
  }

  // Header Kolom Master
  const headers = [
    'ID_KAFE',             // A: ID Unik Login (contoh: paruhwaktu)
    'PIN_OWNER',           // B: PIN Pemilik (contoh: 1234)
    'PIN_KASIR',           // C: PIN Kasir/Barista (contoh: 0000)
    'NAMA_KAFE',           // D: Nama Kafe Tampilan
    'LINK_GAS_KAFE',       // E: Link Web App database penjualan kafe ini
    'FOLDER_ID_FOTO',      // F: ID Folder Drive foto menu kafe ini
    'STATUS',              // G: AKTIF / NONAKTIF
    'TANGGAL_EXPIRED',     // H: YYYY-MM-DD atau LIFETIME
    'KUOTA_ALAT',          // I: Maksimal perangkat (default 3: HP, Tablet, Laptop)
    'DEVICE_TERDAFTAR',    // J: ID Perangkat yang sudah login (otomatis diisi sistem)
    'NO_WA_OWNER',         // K: No WhatsApp pemilik
    'TANGGAL_GABUNG',      // L: Tanggal mulai beli/bergabung
    'CATATAN'              // M: Catatan internal (paket, pembayaran, dll)
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format Header (Warna Espresso Elegan)
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#3b2219')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  // Masukkan 2 Baris Contoh Data jika tabel masih kosong
  if (sheet.getLastRow() === 1) {
    const sampleData = [
      [
        'paruhwaktu',
        '1234',
        '0000',
        'Cafe Paruh Waktu',
        'https://script.google.com/macros/s/CONTOH_LINK_GAS_PARUHWAKTU/exec',
        '',
        'AKTIF',
        '2027-12-31',
        3,
        '',
        '081234567890',
        '2026-11-04',
        'Paket 3 Alat - Lunas'
      ],
      [
        'kopisenja',
        '8888',
        '1111',
        'Kopi Senja Nusantara',
        'https://script.google.com/macros/s/CONTOH_LINK_GAS_KOPISENJA/exec',
        '',
        'AKTIF',
        'LIFETIME',
        3,
        '',
        '089876543210',
        '2026-11-04',
        'Beli Putus Selamanya'
      ]
    ];
    sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
  }

  // Atur format text pada kolom PIN agar angka 0 di depan (0000) tidak hilang
  sheet.getRange('B2:C1000').setNumberFormat('@');
  sheet.getRange('A2:A1000').setNumberFormat('@');

  // Auto width kolom
  for (let c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }

  Logger.log('Setup Master Database Berhasil!');
}

/**
 * FUNGSI 2: doGet() & doPost()
 * Menangani permintaan Login, Cek Lisensi & Pendaftaran Perangkat dari aplikasi web GitHub
 */
function doGet(e) {
  const action = e?.parameter?.action;
  
  if (action === 'PING') {
    return createJsonResponse({ status: 'OK', message: 'Master Database Aktif & Terhubung!' });
  }

  return createJsonResponse({ 
    status: 'INFO', 
    message: 'Master Database Kasir Kopi API siap menerima permintaan.' 
  });
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action;

    // 1. ACTION: LOGIN_KAFE
    if (action === 'LOGIN_KAFE') {
      return handleLoginKafe(payload);
    }

    // 2. ACTION: VERIFY_DEVICE (Cek apakah perangkat masih sah atau sudah dihapus di spreadsheet)
    if (action === 'VERIFY_DEVICE') {
      return handleVerifyDevice(payload);
    }

    // 3. ACTION: RESET_DEVICES (Jika Owner ganti HP dan ingin hapus daftar HP lama)
    if (action === 'RESET_DEVICES') {
      return handleResetDevices(payload);
    }

    return createJsonResponse({ success: false, message: 'Action tidak dikenali' });

  } catch (error) {
    return createJsonResponse({ success: false, message: 'Terjadi kesalahan server: ' + error.message });
  }
}

/**
 * Logika Validasi Login, Lisensi & Batasan 3 Perangkat
 */
function handleLoginKafe(data) {
  const idKafe = String(data.idKafe || '').trim().toLowerCase();
  const inputPin = String(data.pin || '').trim();
  const deviceId = String(data.deviceId || '').trim();
  const deviceName = String(data.deviceName || 'Perangkat Kasir').trim();

  if (!idKafe || !inputPin) {
    return createJsonResponse({ success: false, message: 'ID Kafe dan PIN wajib diisi.' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return createJsonResponse({ success: false, message: 'Tabel MASTER_KAFE tidak ditemukan.' });
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createJsonResponse({ success: false, message: 'Belum ada data kafe terdaftar.' });
  }

  // Cari baris kafe berdasarkan ID_KAFE (Kolom A / index 0)
  let foundRowIdx = -1;
  let rowData = null;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === idKafe) {
      foundRowIdx = i + 1; // 1-based index di Google Sheets
      rowData = values[i];
      break;
    }
  }

  if (foundRowIdx === -1) {
    return createJsonResponse({ success: false, message: 'ID Kafe tidak ditemukan. Periksa kembali penulisan ID.' });
  }

  const pinOwner = String(rowData[1]).trim();
  const pinKasir = String(rowData[2]).trim();
  const namaKafe = String(rowData[3]).trim();
  const linkGas = String(rowData[4]).trim();
  const folderIdFoto = String(rowData[5]).trim();
  const statusLisensi = String(rowData[6]).toUpperCase().trim();
  const tglExpired = rowData[7];
  const kuotaAlat = parseInt(rowData[8]) || 3;
  let registeredDevicesStr = String(rowData[9] || '').trim();

  // 1. Cek Status Lisensi
  if (statusLisensi !== 'AKTIF') {
    return createJsonResponse({ 
      success: false, 
      message: 'Akses dinonaktifkan oleh administrator. Silakan hubungi pengembang aplikasi.' 
    });
  }

  // 2. Cek Tanggal Kadaluarsa
  if (tglExpired && String(tglExpired).toUpperCase() !== 'LIFETIME') {
    const expiredDate = new Date(tglExpired);
    const today = new Date();
    // Nol-kan jam agar adil per hari
    today.setHours(0, 0, 0, 0);
    if (!isNaN(expiredDate.getTime()) && today > expiredDate) {
      return createJsonResponse({ 
        success: false, 
        message: 'Masa aktif lisensi aplikasi Anda telah berakhir (' + formatDateYMD(expiredDate) + '). Hubungi admin untuk perpanjangan.' 
      });
    }
  }

  // 3. Cek PIN & Tentukan Role (Owner vs Kasir)
  let userRole = null;
  if (inputPin === pinOwner) {
    userRole = 'owner';
  } else if (inputPin === pinKasir) {
    userRole = 'kasir';
  } else {
    return createJsonResponse({ success: false, message: 'PIN yang Anda masukkan salah.' });
  }

  // 4. Validasi Kuota Perangkat (Kunci 3 Alat)
  let deviceList = registeredDevicesStr ? registeredDevicesStr.split('|').map(s => s.trim()).filter(Boolean) : [];

  // Jika ada deviceId yang dikirim dari browser
  if (deviceId) {
    const isDeviceAlreadyRegistered = deviceList.some(item => item.startsWith(deviceId));

    if (!isDeviceAlreadyRegistered) {
      // Perangkat baru mencoba masuk, cek apakah kuota masih cukup
      if (deviceList.length >= kuotaAlat) {
        return createJsonResponse({ 
          success: false, 
          message: 'Batas kuota perangkat untuk kafe ini sudah penuh (' + kuotaAlat + '/' + kuotaAlat + ' alat). Hubungi admin jika ingin mereset perangkat lama.' 
        });
      }

      // Daftarkan perangkat baru
      const newEntry = deviceId + '(' + deviceName + ')';
      deviceList.push(newEntry);
      const newDeviceStr = deviceList.join(' | ');
      
      // Simpan ke kolom J (Kolom 10)
      sheet.getRange(foundRowIdx, 10).setValue(newDeviceStr);
    }
  }

  // 5. Berhasil Login! Kembalikan kredensial dan link database rahasia
  return createJsonResponse({
    success: true,
    message: 'Login berhasil! Selamat bertugas di ' + namaKafe,
    data: {
      idKafe: idKafe,
      namaKafe: namaKafe,
      role: userRole,
      linkGasKafe: linkGas,
      folderIdFoto: folderIdFoto,
      kuotaAlat: kuotaAlat,
      terpakaiAlat: deviceList.length
    }
  });
}

/**
 * Reset Perangkat (Hanya bisa dilakukan jika memasukkan PIN Owner)
 */
function handleResetDevices(data) {
  const idKafe = String(data.idKafe || '').trim().toLowerCase();
  const pinOwner = String(data.pinOwner || '').trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return createJsonResponse({ success: false, message: 'Sheet tidak ditemukan.' });

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === idKafe) {
      if (String(values[i][1]).trim() === pinOwner) {
        // Kosongkan kolom J
        sheet.getRange(i + 1, 10).setValue('');
        return createJsonResponse({ success: true, message: 'Semua perangkat terdaftar berhasil direset. Silakan login kembali dari perangkat yang Anda inginkan.' });
      } else {
        return createJsonResponse({ success: false, message: 'PIN Owner salah untuk melakukan reset perangkat.' });
      }
    }
  }

  return createJsonResponse({ success: false, message: 'ID Kafe tidak ditemukan.' });
}

/**
 * Verifikasi apakah perangkat ini masih terdaftar di Kolom J spreadsheet
 */
function handleVerifyDevice(data) {
  const idKafe = String(data.idKafe || '').trim().toLowerCase();
  const deviceId = String(data.deviceId || '').trim();

  if (!idKafe || !deviceId) {
    return createJsonResponse({ valid: false, message: 'ID Kafe dan Device ID diperlukan.' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return createJsonResponse({ valid: false, message: 'Sheet tidak ditemukan.' });

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === idKafe) {
      const statusLisensi = String(values[i][6]).toUpperCase().trim();
      const tglExpired = values[i][7];
      const registeredDevicesStr = String(values[i][9] || '').trim();

      // 1. Cek Status
      if (statusLisensi !== 'AKTIF') {
        return createJsonResponse({ valid: false, message: 'Akun kafe Anda sedang dinonaktifkan oleh Admin.' });
      }

      // 2. Cek Tanggal Kadaluarsa
      if (tglExpired && String(tglExpired).toUpperCase() !== 'LIFETIME') {
        const exp = new Date(tglExpired);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(exp.getTime()) && today > exp) {
          return createJsonResponse({ valid: false, message: 'Masa aktif lisensi telah berakhir.' });
        }
      }

      // 3. Cek apakah deviceId masih ada di Kolom J
      const deviceList = registeredDevicesStr ? registeredDevicesStr.split('|').map(s => s.trim()).filter(Boolean) : [];
      const isDeviceRegistered = deviceList.some(item => item.startsWith(deviceId));

      if (!isDeviceRegistered) {
        return createJsonResponse({ 
          valid: false, 
          message: 'Akses perangkat ini telah dicabut atau direset oleh Admin di spreadsheet.' 
        });
      }

      return createJsonResponse({ 
        valid: true, 
        message: 'Perangkat sah.',
        namaKafe: values[i][3],
        linkGasKafe: values[i][4]
      });
    }
  }

  return createJsonResponse({ valid: false, message: 'ID Kafe tidak terdaftar.' });
}

// Helper output JSON
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDateYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}
