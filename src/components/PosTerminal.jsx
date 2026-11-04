import React, { useState } from 'react';
import { Search, Plus, Sparkles, Coffee, CupSoda, Flame, Milk, Cookie, PlusCircle, AlertCircle, GlassWater, Tag } from 'lucide-react';
import { formatDriveImageUrl } from '../services/defaultData';

export default function PosTerminal({ 
  products, 
  categories, 
  onAddToCart,
  cartItems
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
    const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
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
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f6f2ec] hover:bg-[#ede7df] focus:bg-white border border-stone-200/90 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#5c3a21] transition-all placeholder:text-stone-400"
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

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all select-none ${
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

      {/* Menu Catalog Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-stone-50">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <Coffee className="w-12 h-12 mb-2 stroke-1 text-stone-300" />
            <p className="font-semibold text-stone-600">Tidak ada menu yang cocok</p>
            <p className="text-xs text-stone-400 mt-0.5">Coba cari dengan kata kunci lain atau pilih kategori Semua</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const cartQty = getProductCartQty(product.id);
              const formattedImg = formatDriveImageUrl(product.imageUrl);

              return (
                <div
                  key={product.id}
                  onClick={() => product.isAvailable !== false && onAddToCart(product)}
                  className={`group relative bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden text-left ${
                    product.isAvailable === false
                      ? 'opacity-60 cursor-not-allowed bg-stone-100'
                      : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-4/3 w-full bg-stone-200 overflow-hidden">
                    {formattedImg ? (
                      <img
                        src={formattedImg}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-600">
                        <Coffee className="w-8 h-8" />
                      </div>
                    )}

                    {/* Cart Quantity Badge on Top */}
                    {cartQty > 0 && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-600 text-white font-bold text-xs rounded-full shadow-md">
                        {cartQty}x
                      </span>
                    )}

                    {/* Out of Stock overlay */}
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-2 py-1 bg-rose-600 rounded-md shadow">
                          HABIS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-amber-800 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Action Button */}
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="font-bold text-amber-900 text-xs sm:text-sm">
                        {formatRupiah(product.price)}
                      </span>
                      <button
                        type="button"
                        disabled={product.isAvailable === false}
                        className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-800 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
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
