import React, { useState } from 'react';
import { Wallet, X, ArrowUpRight, Check, Tag } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function ExpenseModal({
  isOpen,
  onClose,
  onSaveExpense,
  currentUser,
}) {
  const { showToast, showAlert } = useNotification();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Bahan Baku'); // 'Bahan Baku', 'Operasional', 'Lain-lain'

  if (!isOpen) return null;

  const quickAmounts = [10000, 20000, 50000, 100000, 150000, 200000];
  const quickNotes = [
    'Beli Es Batu',
    'Beli Galon Air',
    'Beli Susu Segar',
    'Beli Gula Aren',
    'Sedotan & Plastik',
    'Gas LPG',
    'Kebersihan / Tissue',
    'Biaya Parkir / Pengiriman'
  ];

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showAlert('Nominal Kosong', 'Masukkan nominal kas keluar yang valid!', 'warning');
      return;
    }
    if (!note.trim()) {
      showAlert('Keterangan Kosong', 'Tuliskan keterangan keperluan pengeluaran kas!', 'warning');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    onSaveExpense({
      id: `exp-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      amount: numAmount,
      note: note.trim(),
      category,
      recordedBy: currentUser?.name || 'Kasir',
      createdAt: now.toISOString(),
    });

    setAmount('');
    setNote('');
    onClose();
    showToast(`Kas keluar ${formatRupiah(numAmount)} berhasil dicatat!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#fcfaf7] dark:bg-[#211c19] text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-800 to-amber-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <ArrowUpRight className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Catat Kas Keluar (Petty Cash)</h3>
              <p className="text-[11px] text-amber-100/80">Pengeluaran kas kecil toko agar uang laci tidak selisih</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Nominal Input */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Nominal Pengeluaran (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-stone-500">
                Rp
              </span>
              <input
                type="number"
                required
                min="500"
                step="500"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-[#2c2520] border border-stone-300 dark:border-stone-600 rounded-2xl font-extrabold text-base sm:text-lg text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                autoFocus
              />
            </div>

            {/* Quick Chips Nominal */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q.toString())}
                  className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 hover:text-rose-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors border border-stone-200 dark:border-stone-700"
                >
                  {q >= 1000 ? `${q / 1000}rb` : q}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori Pengeluaran */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Jenis Pengeluaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Bahan Baku', 'Operasional', 'Lain-lain'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    category === cat
                      ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-800 dark:text-rose-200 shadow-2xs'
                      : 'bg-white dark:bg-[#2c2520] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Keterangan Pengeluaran */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Keperluan / Catatan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Beli es batu kristal 2 karung"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#2c2520] border border-stone-300 dark:border-stone-600 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
            />

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNotes.map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 text-stone-600 dark:text-stone-300 text-[10px] font-medium transition-colors"
                >
                  +{qn}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
            Dicatat oleh kasir aktif: <strong>{currentUser?.name || 'Kasir'}</strong>. Saldo uang di laci akan otomatis dipotong sesuai nominal di atas.
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-2xl font-bold text-xs sm:text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 py-3 text-white bg-rose-700 hover:bg-rose-800 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98"
            >
              Simpan Kas Keluar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
