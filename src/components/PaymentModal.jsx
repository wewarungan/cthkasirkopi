import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, QrCode, Banknote, Copy, Check } from 'lucide-react';
import { formatDriveImageUrl } from '../services/defaultData';

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  onProcessPayment,
  settings,
}) {
  const [method, setMethod] = useState('Tunai'); // 'Tunai' or 'QRIS'
  const [cashGiven, setCashGiven] = useState('');
  const [copiedNominal, setCopiedNominal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMethod('Tunai');
      setCashGiven('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numCashGiven = Number(cashGiven) || 0;
  const change = numCashGiven - totalAmount;
  const isCashEnough = numCashGiven >= totalAmount;

  const formatRupiah = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absVal);
    return isNegative ? `- ${formatted}` : formatted;
  };

  // Generate quick cash buttons according to user screenshot
  // Screenshot shows: [Rp 42.000 (Pas)] [Rp 50.000] [Rp 100.000] [Rp 150.000] [Rp 200.000]
  const generateQuickChips = () => {
    const chips = [];
    // Uang Pas
    chips.push({ label: formatRupiah(totalAmount), value: totalAmount, isExact: true });

    // Standard Indonesian cash denominations above total
    const standardDenoms = [20000, 50000, 100000, 150000, 200000, 300000, 500000];
    standardDenoms.forEach((d) => {
      if (d > totalAmount && !chips.some((c) => c.value === d)) {
        chips.push({ label: formatRupiah(d), value: d, isExact: false });
      }
    });

    // Ensure we have up to 5-6 helpful chips
    return chips.slice(0, 5);
  };

  const quickChips = generateQuickChips();

  const handleCopyAmount = () => {
    navigator.clipboard?.writeText(totalAmount.toString());
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  const handleConfirmPay = () => {
    if (method === 'Tunai' && !isCashEnough) return;

    onProcessPayment({
      paymentMethod: method,
      amountPaid: method === 'Tunai' ? numCashGiven : totalAmount,
      changeAmount: method === 'Tunai' ? Math.max(0, change) : 0,
    });
  };

  const qrisUrl = formatDriveImageUrl(settings?.qrisImageUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#fcfaf7] w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-amber-900/10 animate-in slide-in-from-bottom sm:zoom-in-95">
        
        {/* Header Modal */}
        <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-stone-800">Pembayaran</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Total Banner - Brown Box matching screenshot */}
          <div className="bg-[#5c3a21] text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
            <span className="text-sm font-medium text-amber-100/90">Total</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          {/* Payment Method Tabs */}
          <div className="bg-[#ece7e1] p-1.5 rounded-2xl flex gap-1.5">
            <button
              type="button"
              onClick={() => setMethod('Tunai')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                method === 'Tunai'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tunai</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('QRIS')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                method === 'QRIS'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS</span>
            </button>
          </div>

          {method === 'Tunai' ? (
            /* Tab Tunai */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Uang diterima
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 bg-[#f3efe9] border border-stone-200 focus:border-[#5c3a21] focus:bg-white rounded-2xl text-base font-bold text-stone-800 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Quick Cash Chips Grid (Sesuai Foto User) */}
              <div className="grid grid-cols-2 gap-2">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashGiven(chip.value.toString())}
                    className={`py-2.5 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all text-center ${
                      numCashGiven === chip.value
                        ? 'bg-[#5c3a21] text-white border-[#5c3a21] shadow-xs'
                        : 'bg-[#f7f4ee] hover:bg-[#ede8df] text-stone-800 border-stone-200/90'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Kembalian Row - matching screenshot */}
              <div className="p-3.5 bg-[#f3efe9] border border-stone-200 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">Kembalian</span>
                <span className={`text-base font-extrabold ${
                  cashGiven === '' 
                    ? 'text-stone-400' 
                    : isCashEnough 
                      ? 'text-emerald-700' 
                      : 'text-rose-700'
                }`}>
                  {cashGiven === '' ? formatRupiah(0) : formatRupiah(change)}
                </span>
              </div>
            </div>
          ) : (
            /* Tab QRIS */
            <div className="space-y-3 text-center">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col items-center">
                <p className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                  {settings?.qrisMerchantName || 'QRIS STANDAR PEMBAYARAN'}
                </p>

                <div className="w-48 h-48 bg-white p-2 rounded-xl border border-stone-300 shadow-inner flex items-center justify-center overflow-hidden">
                  {qrisUrl ? (
                    <img 
                      src={qrisUrl} 
                      alt="QRIS Toko" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=QRIS_DEMO_KASIR_KOPI';
                      }}
                    />
                  ) : (
                    <div className="text-center p-3 text-stone-400">
                      <QrCode className="w-12 h-12 mx-auto mb-1 stroke-1" />
                      <p className="text-[11px]">QRIS belum diunggah di Pengaturan</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 w-full bg-[#fcfaf7] border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[10px] text-stone-500">Nominal bayar:</p>
                    <p className="text-base font-extrabold text-[#5c3a21]">{formatRupiah(totalAmount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs flex items-center gap-1"
                  >
                    {copiedNominal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-medium">{copiedNominal ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 italic">
                Arahkan layar ke pembeli untuk scan QRIS dari BCA, GoPay, OVO, Dana, dll.
              </p>
            </div>
          )}

          {/* Konfirmasi Pembayaran Button - matching screenshot */}
          <button
            type="button"
            disabled={method === 'Tunai' && !isCashEnough}
            onClick={handleConfirmPay}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              method === 'Tunai' && !isCashEnough
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                : 'bg-[#5c3a21] hover:bg-[#4a2e1a] active:scale-[0.99]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Konfirmasi Pembayaran</span>
          </button>
        </div>
      </div>
    </div>
  );
}
