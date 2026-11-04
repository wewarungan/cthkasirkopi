// Service to interact with Google Sheets via Google Apps Script Web App

const STORAGE_KEYS = {
  PRODUCTS: 'pos_kopi_products',
  CATEGORIES: 'pos_kopi_categories',
  TRANSACTIONS: 'pos_kopi_transactions',
  SETTINGS: 'pos_kopi_settings',
  PENDING_SYNC: 'pos_kopi_pending_sync',
  USERS: 'pos_kopi_users',
  CURRENT_USER: 'pos_kopi_current_user',
  OPEN_TABLES: 'pos_kopi_open_tables',
};

// Local storage helpers
export function getLocalData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

export function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

/**
 * Send transaction to Google Apps Script Web App
 */
export async function syncTransactionToGoogleSheets(scriptUrl, transaction) {
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com')) {
    return { success: false, reason: 'Script URL belum disetel' };
  }

  try {
    const payload = {
      action: 'ADD_TRANSACTION',
      data: {
        invoiceNumber: transaction.invoiceNumber,
        date: transaction.date,
        time: transaction.time,
        customerName: transaction.customerName || 'Pelanggan',
        orderType: transaction.orderType,
        itemsSummary: transaction.items.map(i => `${i.name} (x${i.qty})${i.notes ? ` [${i.notes}]` : ''}`).join(', '),
        subtotal: transaction.subtotal,
        discount: transaction.discount || 0,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        cashier: transaction.cashier || 'Kasir 1',
      },
    };

    // Google Apps Script requires text/plain or URLSearchParams to avoid preflight CORS blockage
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    return { success: true, result };
  } catch (err) {
    console.warn('Gagal sinkron langsung ke Google Sheets (tersimpan lokal):', err);
    // Add to pending sync queue
    const pending = getLocalData(STORAGE_KEYS.PENDING_SYNC, []);
    pending.push(transaction);
    setLocalData(STORAGE_KEYS.PENDING_SYNC, pending);
    return { success: false, error: err.message };
  }
}

/**
 * Test Google Apps Script Web App URL connection
 */
export async function testGoogleScriptConnection(scriptUrl) {
  if (!scriptUrl) return { ok: false, message: 'URL tidak boleh kosong' };
  try {
    const url = new URL(scriptUrl);
    url.searchParams.append('action', 'PING');
    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();
    if (data.status === 'OK' || data.success) {
      return { ok: true, message: 'Koneksi ke Google Sheets berhasil!' };
    }
    return { ok: false, message: data.message || 'Respons tidak dikenali dari Google Sheets' };
  } catch (err) {
    return { ok: false, message: `Gagal terhubung: ${err.message}. Pastikan Web App disetel aksesnya ke "Anyone (Siapa saja)".` };
  }
}

/**
 * Sync all pending offline transactions
 */
export async function processPendingSync(scriptUrl) {
  const pending = getLocalData(STORAGE_KEYS.PENDING_SYNC, []);
  if (!pending.length || !scriptUrl) return 0;

  const remaining = [];
  let syncedCount = 0;

  for (const tx of pending) {
    try {
      await syncTransactionToGoogleSheets(scriptUrl, tx);
      syncedCount++;
    } catch {
      remaining.push(tx);
    }
  }

  setLocalData(STORAGE_KEYS.PENDING_SYNC, remaining);
  return syncedCount;
}

export { STORAGE_KEYS };
