// Service untuk menghubungkan aplikasi ke Master Database Google Apps Script

export const MASTER_GAS_URL = 'https://script.google.com/macros/s/AKfycbzTDg-9uVDVde5hEqR-1v1IxptFM5MdnC-LsfBWeVdVE9OmTfkSrw43ysoIYTiPIIg/exec';

const SESSION_KEY = 'pos_kopi_master_session';
const DEVICE_KEY = 'pos_kopi_device_id';

/**
 * Mendapatkan atau membuat ID unik untuk perangkat ini (HP, Tablet, Laptop)
 */
export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const rand = Math.random().toString(36).substring(2, 8);
      const time = Date.now().toString(36);
      id = `DEV-${rand}-${time}`.toUpperCase();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'DEV-UNKNOWN-' + Date.now();
  }
}

/**
 * Deteksi tipe perangkat secara cerdas (HP, Tablet, atau Laptop/PC)
 */
export function getDeviceTypeInfo() {
  if (typeof navigator === 'undefined') return { type: 'PC', label: 'Laptop / PC' };
  const ua = navigator.userAgent || '';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return { type: 'TABLET', label: 'Tablet Kasir' };
  }
  if (/mobile|android|iphone|ipod/i.test(ua)) {
    return { type: 'HP', label: 'Smartphone / HP Kasir' };
  }
  return { type: 'LAPTOP', label: 'Laptop / Komputer' };
}

/**
 * Cek sesi kafe yang sedang aktif
 */
export function getMasterSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error reading master session', e);
    return null;
  }
}

export function setMasterSession(sessionData) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Error saving master session', e);
  }
}

export function clearMasterSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Error clearing master session', e);
  }
}

/**
 * Validasi kekuatan password:
 * - Minimal 6 karakter
 * - Memiliki huruf besar (A-Z)
 * - Memiliki huruf kecil (a-z)
 * - Memiliki angka (0-9)
 * - Memiliki karakter di atas angka (!, @, #, $, %, ^, &, *, (, ))
 */
export function validatePasswordStrength(password) {
  const minLength = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial
  };
}

/**
 * Kirim permintaan login ke Master GAS
 */
export async function authenticateWithMaster(idKafe, password) {
  const deviceId = getOrCreateDeviceId();
  const deviceInfo = getDeviceTypeInfo();

  const payload = {
    action: 'LOGIN_KAFE',
    idKafe: String(idKafe || '').trim().toLowerCase(),
    pin: String(password || '').trim(),
    deviceId: deviceId,
    deviceName: `${deviceInfo.label}`
  };

  try {
    const response = await fetch(MASTER_GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Master login error:', err);
    return {
      success: false,
      message: 'Gagal terhubung ke Master Database. Periksa koneksi internet Anda.'
    };
  }
}

/**
 * Cek apakah perangkat ini masih sah di Master Spreadsheet
 */
export async function verifyDeviceWithMaster(idKafe, deviceId) {
  if (!idKafe || !deviceId) return { valid: true };

  try {
    const payload = {
      action: 'VERIFY_DEVICE',
      idKafe: idKafe,
      deviceId: deviceId
    };

    const response = await fetch(MASTER_GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return result;
  } catch (err) {
    // Jika offline, izinkan jualan sementara (Offline-First)
    console.warn('Verifikasi perangkat offline, diizinkan sementara:', err);
    return { valid: true, offline: true };
  }
}
