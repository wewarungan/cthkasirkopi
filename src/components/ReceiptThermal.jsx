import React, { useState } from 'react';
import { Printer, Share2, Copy, Check, X, Wifi } from 'lucide-react';

export default function ReceiptThermal({
  isOpen,
  onClose,
  transaction,
  settings,
  onNewOrder
}) {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !transaction) return null;

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

  const handleCopyWaText = () => {
    const queueDisplay = transaction.queueNumber || `#${String(transaction.dailyIndex || 1).padStart(2, '0')}`;
    const lines = [
      `☕ *${settings?.storeName || 'KOPI KITA'}*`,
      `${settings?.storeSlogan ? `_${settings.storeSlogan}_\n` : ''}${settings?.storeAddress || ''}`,
      `Telp: ${settings?.storePhone || ''}`,
      `--------------------------------`,
      `🔢 *ANTREAN: ${queueDisplay}*`,
      `No: ${transaction.invoiceNumber}`,
      `Waktu: ${transaction.date} ${transaction.time}`,
      `Kasir: ${transaction.cashier || settings?.cashierName || 'Kasir'}`,
      ...(settings?.showCustomerOnReceipt !== false && transaction.customerName ? [
        `Pesanan: ${transaction.orderType} (${transaction.customerName})`
      ] : []),
      `--------------------------------`,
      ...transaction.items.map(i => `${i.name} x${i.qty} = ${formatRupiah(i.price * i.qty)}${i.notes ? `\n  _${i.notes}_` : ''}`),
      `--------------------------------`,
      `Subtotal: ${formatRupiah(transaction.subtotal)}`,
      ...(transaction.discount > 0 ? [`Diskon: -${formatRupiah(transaction.discount)}`] : []),
      `*Total: ${formatRupiah(transaction.total)}*`,
      `Metode: ${transaction.paymentMethod}`,
      ...(transaction.paymentMethod === 'Tunai' ? [
        `Tunai: ${formatRupiah(transaction.amountPaid)}`,
        `Kembali: ${formatRupiah(transaction.changeAmount)}`
      ] : []),
      ...(settings?.showWifiOnReceipt && settings?.wifiName ? [
        `--------------------------------`,
        `📶 Wi-Fi: ${settings.wifiName}`,
        `🔑 Pass: ${settings.wifiPass || '-'}`
      ] : []),
      `--------------------------------`,
      `${settings?.receiptFooter || 'Terima kasih atas kunjungan Anda\n~ Kopi Kita ~'}`
    ];

    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const printerWidthClass = settings?.printerWidth === '80mm' ? 'max-w-[340px]' : 'max-w-[280px]';

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#ede7df] dark:bg-[#1a1715] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-stone-300 dark:border-stone-800 animate-in zoom-in-95">
        
        {/* Receipt Container preview with smooth scroll and clean bottom breathing room */}
        <div className="p-3 sm:p-6 pb-6 overflow-y-auto flex-1 flex flex-col items-center bg-[#e8e1d7] dark:bg-[#141211]">
          
          {/* Printable Receipt Paper (Monospace Thermal Layout - Full wrapping guarantee) */}
          <div 
            id="printable-receipt"
            className={`w-full ${printerWidthClass} h-auto min-h-fit bg-white px-5 py-6 shadow-2xl border border-stone-300/80 text-stone-900 font-mono text-[12px] leading-relaxed rounded-2xl select-text my-1`}
          >
            {/* Top Paper Tear Edge Effect */}
            <div className="text-center text-stone-300 text-[10px] tracking-[0.25em] -mt-2 mb-3 select-none">
              - - - - - - - - - - - - - - - - - - -
            </div>

            {/* Header: Store Name, Slogan & Address */}
            <div className="text-center space-y-1 pb-3">
              <h2 className="font-extrabold text-base tracking-[0.2em] uppercase text-stone-900">
                {settings?.storeName || 'KOPI KITA'}
              </h2>
              {settings?.storeSlogan && (
                <p className="text-[11px] text-stone-500 font-sans tracking-wide">
                  {settings.storeSlogan}
                </p>
              )}
              <p className="text-[11px] text-stone-600 font-mono">
                {settings?.storeAddress || 'Jl. Merdeka No. 12'}
              </p>
              {settings?.storePhone && (
                <p className="text-[10px] text-stone-500 font-mono">
                  Telp: {settings.storePhone}
                </p>
              )}
            </div>

            {/* Big Queue Number */}
            <div className="text-center py-2 border-t-2 border-b border-stone-800 border-dashed my-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">NOMOR ANTREAN</span>
              <span className="text-3xl font-black tracking-wider text-stone-900 block my-0.5">
                {transaction.queueNumber || `#${String(transaction.dailyIndex || 1).padStart(2, '0')}`}
              </span>
            </div>

            {/* Meta Info: No, Waktu, Kasir */}
            <div className="py-2.5 space-y-1 border-t border-stone-300 border-dashed text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">No</span>
                <span className="font-bold text-stone-900">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Waktu</span>
                <span>{transaction.date} {transaction.time?.slice(0, 5) || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Kasir</span>
                <span>{transaction.cashier || settings?.cashierName || 'Kasir 1'}</span>
              </div>
              {settings?.showCustomerOnReceipt !== false && transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-stone-600">Pelanggan</span>
                  <span className="truncate max-w-[150px]">{transaction.customerName} ({transaction.orderType})</span>
                </div>
              )}
            </div>

            {/* Items List (Dashed lines, clean alignment) */}
            <div className="py-2.5 border-t border-stone-300 border-dashed space-y-1.5 text-[11px]">
              {transaction.items?.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-stone-900">{item.name} x{item.qty}</span>
                    <span className="font-semibold text-stone-900">{formatRupiah(item.price * item.qty)}</span>
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-stone-500 italic pl-2">
                      - {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Calculations: Subtotal, Total, Tunai/QRIS, Kembali */}
            <div className="py-2.5 border-t border-stone-300 border-dashed space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>

              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon</span>
                  <span>- {formatRupiah(transaction.discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-extrabold text-[13px] pt-1 text-stone-900">
                <span>Total</span>
                <span>{formatRupiah(transaction.total)}</span>
              </div>

              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-stone-600">{transaction.paymentMethod === 'Tunai' ? 'Tunai' : 'QRIS'}</span>
                <span>{formatRupiah(transaction.amountPaid || transaction.total)}</span>
              </div>

              {transaction.paymentMethod === 'Tunai' && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-600">Kembali</span>
                  <span>{formatRupiah(transaction.changeAmount || 0)}</span>
                </div>
              )}
            </div>

            {/* Wi-Fi Info Box (Khusus Kedai Kopi - Opsional di Pengaturan) */}
            {settings?.showWifiOnReceipt && settings?.wifiName && (
              <div className="py-2 border-t border-stone-300 border-dashed text-center text-[10px] text-stone-600 bg-stone-50 rounded-lg my-1.5 p-1.5">
                <p className="font-bold flex items-center justify-center gap-1">
                  <span>📶 Free Wi-Fi:</span>
                  <span className="font-mono text-stone-900">{settings.wifiName}</span>
                </p>
                <p>
                  <span>Pass: </span>
                  <span className="font-mono font-bold text-stone-900">{settings.wifiPass || '-'}</span>
                </p>
              </div>
            )}

            {/* Receipt Footer Note */}
            <div className="text-center pt-3 border-t border-stone-300 border-dashed text-[11px] text-stone-600 whitespace-pre-line leading-relaxed">
              <p>{settings?.receiptFooter || 'Terima kasih atas kunjungan Anda\n~ Kopi Kita ~'}</p>
            </div>

            {/* Bottom Paper Tear Edge Effect */}
            <div className="text-center text-stone-300 text-[10px] tracking-[0.25em] mt-4 -mb-2 select-none">
              - - - - - - - - - - - - - - - - - - -
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Sesuai Foto User: [Tutup] dan [Cetak]) */}
        <div className="p-4 bg-white dark:bg-[#211c19] border-t border-stone-200 dark:border-stone-800 space-y-2 shrink-0 shadow-lg">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNewOrder) onNewOrder();
              }}
              className="py-3 px-4 rounded-2xl bg-[#ede7df] hover:bg-[#dfd7cc] text-stone-800 font-bold text-xs sm:text-sm transition-colors text-center"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-3 px-4 rounded-2xl bg-[#5c3a21] hover:bg-[#4a2e1a] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Cetak</span>
            </button>
          </div>

          {/* Quick share to WhatsApp */}
          <button
            type="button"
            onClick={handleCopyWaText}
            className="w-full py-2 text-stone-500 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Teks Struk Tersalin!' : 'Salin Format Teks untuk WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
