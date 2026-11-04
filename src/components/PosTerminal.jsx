import React, { useState } from 'react';
import { Search, Plus, Sparkles, Coffee, CupSoda, Flame, Milk, Cookie, PlusCircle, AlertCircle, GlassWater, Tag, Eye, EyeOff, Wallet, ArrowUpRight } from 'lucide-react';
import { formatDriveImageUrl } from '../services/defaultData';

export default function PosTerminal({ 
  products, 
  categories, 
  onAddToCart,
  cartItems,
  onToggleAvailability,
  onOpenExpenseModal,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Icon mapping helper
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'CupSoda': return <CupSoda className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Milk': return <Milk className="w-4 h-4" />;
      case 'Cookie': return <Cookie className="w-4 h-4" />;
      case 'PlusCircle': return <PlusCircle className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'GlassWater': return <GlassWater className="w-4 h-4" />;
      case 'Tag': return <Tag className="w-4 h-4" />;
      default: return <Coffee className="w-4 h-4" />;
    }
  };

  // Filter products by category and search query
  const filteredProducts = products.filter((item) => {
    let matchCat = true;
    if (selectedCategory === 'best-seller') {
      matchCat = Boolean(item.isBestSeller);
    } else if (selectedCategory === 'baristas-choice') {
      matchCat = Boolean(item.isBaristasChoice);
    } else if (selectedCategory !== 'all') {
      matchCat = item.categoryId === selectedCategory;
    }

    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Calculate current qty in cart for each product
  const getProductCartQty = (productId) => {
    return cartItems
      .filter((ci) => ci.id === productId)
      .reduce((sum, ci) => sum + ci.qty, 0);
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8f5f0]">
      {/* Top Search & Filter Bar */}
      <div className="p-3 sm:p-4 bg-white border-b border-stone-200/80 shadow-2xs space-y-3">
        {/* Search Input & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Cari menu kopi, makanan, topping..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-[#f6f2ec] hover:bg-[#ede7df] focus:bg-white border border-stone-200/90 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#5c3a21] transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 bg-stone-200 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>

          {/* Tombol Catat Kas Keluar (Petty Cash) */}
          {onOpenExpenseModal && (
            <button
              type="button"
              onClick={onOpenExpenseModal}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="Catat uang kas keluar untuk operasional (es batu, galon, dll)"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kas Keluar</span>
            </button>
          )}
        </div>

        {/* Categories & Recommendation Badges Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {/* Semua Menu */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-bold whitespace-nowrap transition-all select-none ${
              selectedCategory === 'all'
                ? 'bg-[#5c3a21] text-white shadow-xs'
                : 'bg-[#ede7df] text-stone-700 hover:bg-[#dfd7cc]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Semua Menu</span>
          </button>

          {/* Quick Filter: Best Seller */}
          <button
            onClick={() => setSelectedCategory('best-seller')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-bold whitespace-nowrap transition-all select-none ${
              selectedCategory === 'best-seller'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <span>🔥 Best Seller</span>
          </button>

          {/* Quick Filter: Barista's Choice */}
          <button
            onClick={() => setSelectedCategory('baristas-choice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-bold whitespace-nowrap transition-all select-none ${
              selectedCategory === 'baristas-choice'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>☕ Barista's Choice</span>
          </button>

          {/* Regular Categories */}
          {categories.filter(c => c.id !== 'all').map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-bold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-[#5c3a21] text-white shadow-xs'
                    : 'bg-[#ede7df] text-stone-700 hover:bg-[#dfd7cc]'
                }`}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Catalog Grid with Mobile Bottom Spacing for Floating Cart Button */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 lg:p-5 pb-28 lg:pb-6 bg-stone-50">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <Coffee className="w-12 h-12 mb-2 stroke-1 text-stone-300" />
            <p className="font-semibold text-stone-600">Tidak ada menu yang cocok</p>
            <p className="text-xs text-stone-400 mt-0.5">Coba cari dengan kata kunci lain atau pilih kategori Semua</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4">
            {filteredProducts.map((product) => {
              const cartQty = getProductCartQty(product.id);
              const formattedImg = formatDriveImageUrl(product.imageUrl);

              return (
                <div
                  key={product.id}
                  onClick={() => product.isAvailable !== false && onAddToCart(product)}
                  className={`group relative bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden text-left h-full ${
                    product.isAvailable === false
                      ? 'opacity-65 cursor-not-allowed bg-stone-100'
                      : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Fixed Uniform Image & Placeholder Container */}
                  <div className="relative h-24 sm:h-28 lg:h-32 w-full bg-gradient-to-br from-stone-100 via-[#f8f5f0] to-stone-200/60 overflow-hidden shrink-0">
                    {formattedImg ? (
                      <img
                        src={formattedImg}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-300 ${product.isAvailable !== false ? 'group-hover:scale-105' : 'grayscale'}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-amber-800/50 bg-gradient-to-br from-amber-50/40 via-stone-100 to-amber-100/30 select-none">
                        <Coffee className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                      </div>
                    )}

                    {/* Badge Top Left: Best Seller & Barista's Choice */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
                      {product.isBestSeller && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-orange-600 text-white font-extrabold text-[9px] sm:text-[10px] rounded-lg shadow-md flex items-center gap-0.5">
                          🔥 Best Seller
                        </span>
                      )}
                      {product.isBaristasChoice && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-[#5c3a21] text-amber-100 font-extrabold text-[9px] sm:text-[10px] rounded-lg shadow-md flex items-center gap-0.5">
                          ☕ Barista's Choice
                        </span>
                      )}
                    </div>

                    {/* Cart Quantity Badge on Top Right */}
                    {cartQty > 0 && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-2 py-0.5 bg-[#5c3a21] text-white font-bold text-[10px] sm:text-xs rounded-full shadow-md z-10">
                        {cartQty}x
                      </span>
                    )}

                    {/* Quick 1-Click Sold Out Toggle positioned safely at Bottom Right (Anti-Bertumpuk) */}
                    {onToggleAvailability && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleAvailability(product.id);
                        }}
                        title={product.isAvailable !== false ? "Tandai Habis (Sold Out)" : "Tandai Tersedia Kembali"}
                        className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white transition-all z-10 active:scale-90 shadow-sm"
                      >
                        {product.isAvailable !== false ? (
                          <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-300" />
                        ) : (
                          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/90 hover:text-white" />
                        )}
                      </button>
                    )}

                    {/* Out of Stock overlay */}
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-stone-900/65 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                        <span className="text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 bg-rose-600 rounded-lg shadow-md uppercase tracking-wider">
                          HABIS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-amber-800 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[10px] sm:text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Action Button */}
                    <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-stone-100">
                      <span className="font-extrabold text-[#5c3a21] text-xs sm:text-sm">
                        {formatRupiah(product.price)}
                      </span>
                      <button
                        type="button"
                        disabled={product.isAvailable === false}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-colors shadow-2xs ${
                          product.isAvailable === false 
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-amber-100 text-amber-900 hover:bg-[#5c3a21] hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
