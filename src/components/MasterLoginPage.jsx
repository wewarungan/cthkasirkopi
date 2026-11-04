import React, { useState } from 'react';
import { Coffee, Key, Lock, Eye, EyeOff, ShieldCheck, Smartphone, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { authenticateWithMaster, validatePasswordStrength, getDeviceTypeInfo, getOrCreateDeviceId } from '../services/masterAuth';
import WeWarunganLogo from './WeWarunganLogo';

export default function MasterLoginPage({ onLoginSuccess }) {
  const [idKafe, setIdKafe] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const deviceInfo = getDeviceTypeInfo();
  const deviceId = getOrCreateDeviceId();
  const passwordStatus = validatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!idKafe.trim()) {
      setErrorMessage('Silakan masukkan ID Kafe Anda.');
      return;
    }

    if (!password) {
      setErrorMessage('Silakan masukkan Password Anda.');
      return;
    }

    // Validasi aturan password: min 6 digit, angka, huruf besar/kecil, dan karakter khusus
    if (!passwordStatus.isValid) {
      setErrorMessage('Password belum memenuhi standar keamanan (minimal 6 karakter, ada huruf besar, angka, dan karakter khusus seperti !, @, #, $, dll).');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authenticateWithMaster(idKafe, password);

      if (response.success && response.data) {
        onLoginSuccess(response.data);
      } else {
        setErrorMessage(response.message || 'ID Kafe atau Password tidak sesuai.');
      }
    } catch (err) {
      setErrorMessage('Terjadi gangguan jaringan. Pastikan perangkat Anda terhubung ke internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-stone-100 dark:bg-[#120f0d] p-4 font-sans select-none">
      
      {/* Brand Perusahaan Digital: WeWarungan */}
      <div className="mb-6 flex flex-col items-center animate-fade-in">
        <WeWarunganLogo size="md" showTagline={true} />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#1e1916] rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden">
        
        {/* Header Visual Produk */}
        <div className="bg-[#5c3a21] text-amber-100 p-6 sm:p-7 text-center relative">
          <div className="w-14 h-14 mx-auto mb-2.5 bg-[#4a2e1a] rounded-2xl flex items-center justify-center shadow-lg border border-amber-200/20">
            <Coffee className="w-7 h-7 text-amber-200 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Kasir Kopi POS
          </h1>
          <p className="text-xs text-amber-200/80 mt-1 font-medium">
            Produk Resmi dari Ekosistem WeWarungan
          </p>

          {/* Badge Perangkat Ini */}
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-[#412715]/90 border border-amber-300/20 text-[11px] font-semibold text-amber-100">
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span>Perangkat: {deviceInfo.label}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Input 1: ID Kafe */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              ID Kafe / Toko
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Coffee className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={idKafe}
                onChange={(e) => setIdKafe(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Contoh: paruhwaktu"
                autoCapitalize="none"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm font-semibold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5c3a21] transition-all"
              />
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">
              ID terdaftar yang diberikan oleh pengembang aplikasi.
            </p>
          </div>

          {/* Input 2: Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Password Kafe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password Kafe"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm font-semibold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5c3a21] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checklist Indikator Standar Keamanan Password */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/40 rounded-xl border border-stone-200/70 dark:border-stone-800 space-y-1 text-[11px]">
              <span className="font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                Kriteria Password:
              </span>
              <div className="grid grid-cols-2 gap-1">
                <div className={`flex items-center gap-1 ${passwordStatus.minLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-stone-400'}`}>
                  {passwordStatus.minLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Minimal 6 digit</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordStatus.hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-stone-400'}`}>
                  {passwordStatus.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Ada huruf besar (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordStatus.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-stone-400'}`}>
                  {passwordStatus.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Ada angka (0-9)</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordStatus.hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-stone-400'}`}>
                  {passwordStatus.hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Karakter (!@#$%^&*)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-[#5c3a21] hover:bg-[#4a2e1a] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                <span>Memverifikasi Lisensi...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-200" />
                <span>Masuk ke Aplikasi Kasir</span>
              </>
            )}
          </button>

          {/* Footer Info */}
          <div className="pt-2 text-center text-[11px] text-stone-400 dark:text-stone-500 space-y-1">
            <p>1 Akun Kafe mendukung hingga 3 perangkat (HP, Tablet, Laptop).</p>
            <p className="text-[10px] text-stone-400/80">Device ID: <span className="font-mono">{deviceId}</span></p>
          </div>
        </form>

      </div>

      {/* Corporate Sub-Footer */}
      <p className="mt-5 text-xs text-stone-500 dark:text-stone-400 text-center font-semibold">
        © 2026 WeWarungan Digital • Solusi Aplikasi Bisnis Terpercaya
      </p>
    </div>
  );
}
