import React from 'react';
import { Utensils, Clock, Trash2, ArrowRight, X, User } from 'lucide-react';

export default function OpenTablesModal({
  isOpen,
  onClose,
  openTables = [],
  onLoadTable,
  onCancelTable,
}) {
  if (!isOpen) return null;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-[#fcfaf7] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-200">
        
        {/* Header */}
        <div className="p-4 bg-[#5c3a21] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <Utensils className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Daftar Meja Aktif (Open Table)</h3>
              <p className="text-[11px] text-amber-100/80">Tagihan pelanggan yang belum dibayar / masih nongkrong</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {openTables.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <Utensils className="w-12 h-12 mx-auto stroke-1 text-stone-300" />
              <p className="font-bold text-stone-700 text-sm">Tidak Ada Meja Aktif</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Jika pelanggan ingin memesan dulu dan bayar nanti, klik tombol <strong>"Simpan Meja"</strong> di keranjang.
              </p>
            </div>
          ) : (
            openTables.map((tbl) => {
              const totalItems = tbl.items?.reduce((s, i) => s + (i.qty || 1), 0) || 0;

              return (
                <div
                  key={tbl.id}
                  className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:border-[#b58e6d] transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 text-sm sm:text-base">
                          {tbl.customerName || tbl.tableNumber || 'Meja Tanpa Nama'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {tbl.orderType || 'Dine In'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Disimpan jam {tbl.savedAtTime || tbl.time} ({totalItems} item pesanan)</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-base text-[#5c3a21]">
                        {formatRupiah(tbl.total)}
                      </span>
                    </div>
                  </div>

                  {/* Summary of items */}
                  <div className="p-2.5 bg-[#f8f5f0] rounded-xl text-xs text-stone-700 space-y-1">
                    {tbl.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span>{item.name} x{item.qty} {item.notes ? `(${item.notes})` : ''}</span>
                        <span className="font-semibold">{formatRupiah(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin membatalkan pesanan ${tbl.customerName || tbl.tableNumber}?`)) {
                          onCancelTable(tbl.id);
                        }
                      }}
                      className="text-stone-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadTable(tbl)}
                      className="px-4 py-2 bg-[#5c3a21] hover:bg-[#4a2e1a] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Buka & Lanjut Pesan / Bayar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
