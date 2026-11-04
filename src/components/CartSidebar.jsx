import React, { useState } from 'react';
import { Trash2, Plus, Minus, MessageSquare, Utensils, Package, X, Coffee } from 'lucide-react';
import { formatDriveImageUrl } from '../services/defaultData';

export default function CartSidebar({
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onUpdateNotes,
  onClearCart,
  orderType,
  setOrderType,
  customerName,
  setCustomerName,
  discount,
  setDiscount,
  onOpenPayment,
  onSaveOpenTable,
  onOpenTableList,
  openTablesCount = 0,
  isMobileDrawer = false,
  onCloseMobileDrawer
}) {
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'nominal'
  const [discountVal, setDiscountVal] = useState(0);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Calculate discount nominal
  const calculatedDiscount = discountType === 'percent'
    ? Math.round((subtotal * (discountVal || 0)) / 100)
    : Number(discountVal) || 0;

  const total = Math.max(0, subtotal - calculatedDiscount);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleOpenNoteModal = (item) => {
    setEditingNotesId(item.cartItemId || item.id);
    setTempNote(item.notes || '');
  };

  const handleSaveNote = () => {
    if (editingNotesId) {
      onUpdateNotes(editingNotesId, tempNote);
      setEditingNotesId(null);
      setTempNote('');
    }
  };

  const handleCheckout = () => {
    setDiscount(calculatedDiscount);
    onOpenPayment();
  };

  const quickNotes = ['Less Sugar', 'Normal Ice', 'Less Ice', 'Hot', 'Extra Shot', 'Pisah Gula'];

  return (
    <aside className="w-full lg:w-96 bg-[#fcfaf7] border-l border-stone-200/90 flex flex-col h-full shadow-lg lg:shadow-none z-20 font-sans text-stone-800">
      
      {/* Mobile Handle Bar */}
      {isMobileDrawer && (
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0"></div>
      )}

      {/* Top Header - Sesuai Foto 4 */}
      <div className="p-4 border-b border-stone-200/80 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-stone-900 text-base">Keranjang</h2>
          {openTablesCount > 0 && (
            <button
              type="button"
              onClick={onOpenTableList}
              className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold flex items-center gap-1 hover:bg-amber-200 transition-colors"
              title="Lihat Meja Aktif"
            >
              <Utensils className="w-2.5 h-2.5" />
              <span>{openTablesCount} Meja Aktif</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {cartItems.length > 0 && (
            <button
              onClick={onClearCart}
              title="Kosongkan Pesanan"
              className="text-stone-400 hover:text-rose-600 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Hapus Semua
            </button>
          )}

          {isMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Order Type Selector & Customer Input */}
      <div className="p-3 bg-[#f7f3ee] border-b border-stone-200/80 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-1.5 bg-[#eae4db] p-1 rounded-xl">
          <button
            onClick={() => setOrderType('Dine In')}
            className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'Dine In'
                ? 'bg-white text-[#5c3a21] shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine In</span>
          </button>
          <button
            onClick={() => setOrderType('Take Away')}
            className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'Take Away'
                ? 'bg-white text-[#5c3a21] shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Take Away</span>
          </button>
        </div>

        <input
          type="text"
          placeholder={orderType === 'Dine In' ? "Nama / Meja (contoh: Meja 4)" : "Nama Pembeli (contoh: Mas Budi)"}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#5c3a21]"
        />
      </div>

      {/* Cart Items List - Sesuai Foto 4 */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-white">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <Coffee className="w-12 h-12 stroke-1 mb-2 text-stone-300" />
            <p className="font-bold text-stone-700 text-sm">Keranjang Masih Kosong</p>
            <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
              Silakan pilih menu kopi atau makanan untuk ditambahkan ke pesanan.
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const itemKey = item.cartItemId || item.id;
            const imgUrl = formatDriveImageUrl(item.imageUrl);

            return (
              <div
                key={itemKey}
                className="py-2.5 border-b border-stone-100 flex items-center justify-between gap-2.5 text-xs"
              >
                {/* Left Thumbnail (Sesuai Foto 4) */}
                <div className="w-12 h-12 rounded-2xl bg-[#f5ede3] p-1 border border-stone-200/80 shrink-0 flex items-center justify-center overflow-hidden">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <Coffee className="w-5 h-5 text-[#7d5635]" />
                  )}
                </div>

                {/* Middle Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                    {item.name}
                  </h4>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    {formatRupiah(item.price)}
                  </p>

                  {/* Notes button / badge */}
                  {item.notes ? (
                    <button
                      onClick={() => handleOpenNoteModal(item)}
                      className="text-[10px] text-[#7d5635] bg-[#fbf5ed] border border-[#ecdccb] px-1.5 py-0.5 rounded-md mt-1 truncate max-w-full text-left"
                    >
                      ✏️ {item.notes}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenNoteModal(item)}
                      className="text-[10px] text-stone-400 hover:text-stone-700 mt-0.5"
                    >
                      + Catatan varian
                    </button>
                  )}
                </div>

                {/* Right Controls: Stepper + Total + Hapus (Sesuai Foto 4) */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {/* Stepper pill */}
                  <div className="flex items-center gap-2 bg-[#f4efe8] px-2 py-1 rounded-2xl border border-stone-200/80">
                    <button
                      onClick={() => onUpdateQty(itemKey, -1)}
                      className="text-stone-600 hover:text-stone-900 font-bold p-0.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-extrabold text-stone-900 w-4 text-center text-xs">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(itemKey, 1)}
                      className="text-stone-600 hover:text-stone-900 font-bold p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                    {formatRupiah(item.price * item.qty)}
                  </span>

                  <button
                    onClick={() => onRemoveItem(itemKey)}
                    className="text-[11px] text-[#b05d49] hover:text-rose-700 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Calculation & Pay Button - Sesuai Foto 4 */}
      {cartItems.length > 0 && (
        <div className="p-4 bg-white border-t border-stone-200/90 space-y-3 shadow-lg">
          
          {/* Diskon Row with Pill Input (Sesuai Foto 4) */}
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-medium">Diskon</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : subtotal}
                value={discountVal || ''}
                onChange={(e) => setDiscountVal(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-16 text-right px-2 py-1 bg-[#f7f3ee] border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setDiscountType(prev => prev === 'percent' ? 'nominal' : 'percent')}
                className="px-2 py-1 rounded-xl bg-[#ede7df] hover:bg-stone-300 text-stone-700 font-bold text-[10px]"
                title="Ganti Persen (%) atau Rupiah (Rp)"
              >
                {discountType === 'percent' ? '%' : 'Rp'}
              </button>
            </div>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between items-center text-xs text-stone-500">
            <span>Subtotal</span>
            <span className="font-semibold text-stone-700">{formatRupiah(subtotal)}</span>
          </div>

          {/* Total (Large font bold - Sesuai Foto 4) */}
          <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-stone-200 text-stone-900">
            <span className="font-bold text-sm">Total</span>
            <span className="font-extrabold text-xl text-[#5c3a21]">{formatRupiah(total)}</span>
          </div>

          {/* Action Buttons: Simpan Meja (Open Table) & Bayar Langsung */}
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => onSaveOpenTable && onSaveOpenTable({
                customerName: customerName.trim() || 'Meja',
                orderType,
                items: [...cartItems],
                subtotal,
                discount: calculatedDiscount,
                total,
              })}
              className="col-span-2 py-3.5 bg-[#ede7df] hover:bg-[#dfd7cc] active:scale-[0.99] text-stone-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              title="Simpan pesanan untuk bayar nanti"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Simpan Meja</span>
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              className="col-span-3 py-3.5 bg-[#5c3a21] hover:bg-[#4a2e1a] active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-md transition-all text-center"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit Note */}
      {editingNotesId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-4 shadow-xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm">Catatan Menu</h3>
              <button 
                onClick={() => setEditingNotesId(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows="2"
              placeholder="Contoh: Less Sugar, Es Sedikit, Extra Shot..."
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              className="w-full p-2.5 text-xs bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21]"
            />

            <div className="flex flex-wrap gap-1.5">
              {quickNotes.map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setTempNote((prev) => (prev ? `${prev}, ${qn}` : qn))}
                  className="px-2 py-1 bg-[#ede7de] hover:bg-[#dfd5c8] text-stone-700 rounded-lg text-[10px] font-medium transition-colors"
                >
                  +{qn}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTempNote('');
                  onUpdateNotes(editingNotesId, '');
                  setEditingNotesId(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#5c3a21] hover:bg-[#4a2e1a] rounded-xl transition-colors shadow-xs"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
