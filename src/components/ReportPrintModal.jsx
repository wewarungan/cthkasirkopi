import React from 'react';
import { Printer, Download, X, Coffee, Clock, CreditCard, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { exportReportToExcel, exportReportToPdf } from '../services/reportExport';

export default function ReportPrintModal({
  isOpen,
  onClose,
  settings,
  currentUser,
  periodLabel,
  dateRangeStr,
  summary,
  transactions = [],
  expenses = [],
  topProducts = [],
  paymentStats,
  peakHourData,
  orderTypeStats
}) {
  if (!isOpen) return null;

  const isOwner = currentUser?.role === 'owner';
  const storeName = settings?.storeName || 'KOPI KITA';
  const now = new Date();
  const printDateStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    exportReportToExcel({
      settings,
      periodLabel,
      dateRangeStr,
      currentUser,
      summary,
      transactions,
      expenses,
      topProducts,
      paymentStats,
      peakHourData,
      orderTypeStats
    });
  };

  const handleDownloadPdf = () => {
    exportReportToPdf({
      settings,
      periodLabel,
      dateRangeStr,
      currentUser,
      summary,
      transactions,
      expenses,
      topProducts,
      paymentStats,
      peakHourData,
      orderTypeStats
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#f5f2eb] dark:bg-[#1a1715] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh] border border-stone-300 dark:border-stone-800 animate-in zoom-in-95">
        
        {/* Header Action Bar */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-[#211c19] border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm sm:text-base flex items-center gap-2">
              <span>Pratinjau Laporan Resmi (Format A4)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {periodLabel}
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              Dapat langsung diunduh ke format PDF & Excel, atau dicetak fisik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Excel Button */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              title="Unduh File Excel Lengkap dengan 4 Sheet"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Download Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            {/* Direct Download PDF Button (1-Click Download) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-[#b05d49] hover:bg-[#974b39] active:scale-[0.98] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              title="Download File PDF Langsung"
            >
              <Download className="w-4 h-4 text-rose-100" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[#ede7df] hover:bg-[#dfd7cc] text-stone-700 active:scale-[0.98] text-xs font-bold transition-all"
              title="Cetak via Printer"
            >
              <Printer className="w-4 h-4 text-stone-700" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable A4 Document View */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-[#eae4db] dark:bg-[#12100f]">
          <div 
            id="printable-report-a4"
            className="w-full max-w-[800px] bg-white text-stone-900 p-6 sm:p-10 shadow-xl border border-stone-200/90 rounded-2xl font-sans text-xs sm:text-[13px] leading-relaxed select-text space-y-6"
          >
            {/* 1. KOP SURAT KEDAI KOPI */}
            <div className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-stone-900">
                  {storeName}
                </h1>
                {settings?.storeSlogan && (
                  <p className="text-xs text-stone-600 font-medium italic">
                    {settings.storeSlogan}
                  </p>
                )}
                <p className="text-xs text-stone-500">
                  {settings?.storeAddress || 'Jl. Kopi Kenangan No. 42'} • Telp: {settings?.storePhone || '-'}
                </p>
              </div>

              <div className="text-left sm:text-right text-[11px] text-stone-600 space-y-0.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200 shrink-0">
                <p className="font-bold text-stone-900 text-xs">LAPORAN KEUANGAN RESMI</p>
                <p>Periode: <strong>{periodLabel}</strong></p>
                {dateRangeStr && <p className="text-stone-500">{dateRangeStr}</p>}
                <p>Cetak: {printDateStr}</p>
                <p>Oleh: <strong>{currentUser?.name || 'Kasir'}</strong> ({currentUser?.role})</p>
              </div>
            </div>

            {/* 2. RINGKASAN EKSEKUTIF (FINANSIAL) */}
            <div className="space-y-2.5">
              <h3 className="font-extrabold text-stone-900 text-sm uppercase tracking-wide border-b border-stone-200 pb-1 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#5c3a21]" />
                <span>Ringkasan Finansial Kedai</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#fbf9f6] rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-medium block">Total Omset Penjualan</span>
                  <span className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5 block">
                    {formatRupiah(summary.totalOmzet)}
                  </span>
                  <span className="text-[10px] text-stone-400 block">{transactions.length} transaksi selesai</span>
                </div>

                {isOwner && (
                  <div className="p-3 bg-[#fbf9f6] rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-medium block">Total Modal HPP</span>
                    <span className="text-sm sm:text-base font-extrabold text-rose-700 mt-0.5 block">
                      {formatRupiah(summary.totalCost)}
                    </span>
                    <span className="text-[10px] text-stone-400 block">Biaya bahan baku</span>
                  </div>
                )}

                {isOwner && (
                  <div className="p-3 bg-[#fbf9f6] rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-medium block">Laba Kotor (Gross)</span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5 block">
                      {formatRupiah(summary.grossProfit)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">Margin {summary.profitMargin}%</span>
                  </div>
                )}

                <div className="p-3 bg-[#fbf9f6] rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-medium block">Total Kas Keluar</span>
                  <span className="text-sm sm:text-base font-extrabold text-rose-600 mt-0.5 block">
                    {formatRupiah(summary.totalExpense)}
                  </span>
                  <span className="text-[10px] text-stone-400 block">{expenses.length} pos pengeluaran</span>
                </div>
              </div>

              {isOwner && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-950">Laba Bersih Operasional Toko (Net Profit)</span>
                    <p className="text-[11px] text-emerald-700">Laba Kotor dikurangi Total Kas Keluar operasional kedai</p>
                  </div>
                  <span className="text-base sm:text-lg font-black text-emerald-800">
                    {formatRupiah(summary.netProfit)}
                  </span>
                </div>
              )}
            </div>

            {/* 3. DUA INSIGHT OPERASIONAL CAFE (PEAK HOURS & METODE BAYAR) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Insight 1: Jam Paling Ramai */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-200 rounded-lg text-amber-900">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">Jam Paling Ramai (Peak Hours)</h4>
                </div>
                <p className="text-sm font-extrabold text-amber-900">
                  {peakHourData?.timeSlot || '-'}
                </p>
                <p className="text-[11px] text-stone-600">
                  Puncak penjualan mencatat <strong>{peakHourData?.count || 0} transaksi</strong> dengan omset <strong>{formatRupiah(peakHourData?.revenue || 0)}</strong>.
                </p>
              </div>

              {/* Insight 2: Perbandingan Pembayaran */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-stone-200 rounded-lg text-stone-800">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Perbandingan Pembayaran</h4>
                </div>
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="font-semibold text-stone-700">QRIS / Non-Tunai:</span>
                  <span className="font-extrabold text-emerald-700">{paymentStats?.cashlessPercent || 0}% ({formatRupiah(paymentStats?.cashlessTotal || 0)})</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">Tunai (Cash):</span>
                  <span className="font-extrabold text-amber-900">{paymentStats?.cashPercent || 0}% ({formatRupiah(paymentStats?.cashTotal || 0)})</span>
                </div>
              </div>
            </div>

            {/* 4. REKAPITULASI FISIK KAS LACI KASIR */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                Rekapitulasi Arus Kas & Saldo Fisik Laci
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">Total Tunai Masuk</span>
                  <span className="font-bold text-stone-900">{formatRupiah(paymentStats?.cashTotal || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Kas Keluar Terpakai</span>
                  <span className="font-bold text-rose-600">- {formatRupiah(summary.totalExpense || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Estimasi Fisik Uang di Laci</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatRupiah((paymentStats?.cashTotal || 0) - (summary.totalExpense || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Total QRIS Masuk Rekening</span>
                  <span className="font-bold text-stone-900">{formatRupiah(paymentStats?.cashlessTotal || 0)}</span>
                </div>
              </div>
            </div>

            {/* 5. TOP MENU PALING LAKU */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-1">
                Peringkat Produk Terlaris (Top 5 Menu)
              </h4>
              <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">Nama Menu</th>
                    <th className="p-2 text-right">Harga</th>
                    <th className="p-2 text-center">Terjual</th>
                    <th className="p-2 text-right">Total Omset</th>
                    {isOwner && <th className="p-2 text-right">Total Laba</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {topProducts.slice(0, 5).map((prod, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-2 text-center font-bold text-stone-500">{idx + 1}</td>
                      <td className="p-2 font-medium text-stone-900">{prod.name}</td>
                      <td className="p-2 text-right">{formatRupiah(prod.price)}</td>
                      <td className="p-2 text-center font-bold">{prod.qty} cup</td>
                      <td className="p-2 text-right font-bold text-stone-900">{formatRupiah(prod.totalRevenue || (prod.price * prod.qty))}</td>
                      {isOwner && (
                        <td className="p-2 text-right font-bold text-emerald-700">
                          {formatRupiah(prod.totalProfit || ((prod.price - (prod.cost || 0)) * prod.qty))}
                        </td>
                      )}
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={isOwner ? 6 : 5} className="p-4 text-center text-stone-400">
                        Belum ada data penjualan pada periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 6. LEMBAR PENGESAHAN (TANDA TANGAN RESMI) */}
            <div className="pt-8 border-t border-stone-300 mt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-14">
                <p className="font-semibold text-stone-700">Dibuat & Dilaporkan Oleh,</p>
                <div>
                  <p className="font-bold text-stone-900 underline">{currentUser?.name || 'Kasir Kedai'}</p>
                  <p className="text-[10px] text-stone-500">Kasir / Admin Operasional</p>
                </div>
              </div>

              <div className="space-y-14">
                <p className="font-semibold text-stone-700">Disetujui & Diterima Oleh,</p>
                <div>
                  <p className="font-bold text-stone-900 underline">( ............................................ )</p>
                  <p className="text-[10px] text-stone-500">Pemilik Kedai (Owner)</p>
                </div>
              </div>
            </div>

            {/* Footer Cetak Info */}
            <div className="pt-4 border-t border-stone-200 text-center text-[10px] text-stone-400 font-mono">
              Dicetak otomatis via Aplikasi Kasir Kopi • Dokumen ini sah sebagai rekapitulasi operasional internal kedai.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
