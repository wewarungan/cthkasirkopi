import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Image, Check, AlertCircle, Coffee, Eye, EyeOff, 
  Link, Upload, X, Layers, Tag, CupSoda, Flame, Milk, Cookie, Sparkles, PlusCircle, GlassWater
} from 'lucide-react';
import { formatDriveImageUrl } from '../services/defaultData';
import { useNotification } from '../context/NotificationContext';

const AVAILABLE_ICONS = [
  { id: 'Coffee', label: 'Kopi', component: Coffee },
  { id: 'CupSoda', label: 'Minuman Dingin', component: CupSoda },
  { id: 'Flame', label: 'Panas', component: Flame },
  { id: 'Milk', label: 'Susu / Creamer', component: Milk },
  { id: 'Cookie', label: 'Kue / Snack', component: Cookie },
  { id: 'Sparkles', label: 'Signature / Spesial', component: Sparkles },
  { id: 'GlassWater', label: 'Segar / Mocktail', component: GlassWater },
  { id: 'Tag', label: 'Promo / Diskon', component: Tag },
  { id: 'PlusCircle', label: 'Topping / Extra', component: PlusCircle },
];

export default function MenuManager({
  products,
  categories,
  onSaveProduct,
  onDeleteProduct,
  onToggleAvailability,
  onSaveCategory,
  onDeleteCategory
}) {
  const { showToast, showAlert, showConfirm } = useNotification();
  const [activeSubTab, setActiveSubTab] = useState('products'); // 'products' or 'categories'
  
  // Product state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: 'es-kopi',
    price: '',
    costPrice: '',
    imageUrl: '',
    description: '',
    isAvailable: true,
  });
  const [imageMode, setImageMode] = useState('gdrive');
  const [previewImage, setPreviewImage] = useState('');

  // Category state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    icon: 'Coffee',
  });

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getCategoryIconComponent = (iconName) => {
    const found = AVAILABLE_ICONS.find(i => i.id === iconName);
    const Comp = found ? found.component : Coffee;
    return <Comp className="w-4 h-4" />;
  };

  // --- Handlers for Products ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      categoryId: categories.find(c => c.id !== 'all')?.id || 'es-kopi',
      price: '',
      costPrice: '',
      imageUrl: '',
      description: '',
      isAvailable: true,
    });
    setPreviewImage('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      costPrice: product.costPrice || '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      isAvailable: product.isAvailable !== false,
    });
    setPreviewImage(formatDriveImageUrl(product.imageUrl));
    setIsProductModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('Ukuran Foto Terlalu Besar', 'Ukuran file foto maksimal 2MB agar aplikasi tetap cepat dan ringan.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        setProductForm(prev => ({ ...prev, imageUrl: base64Url }));
        setPreviewImage(base64Url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDriveUrlChange = (url) => {
    setProductForm(prev => ({ ...prev, imageUrl: url }));
    setPreviewImage(formatDriveImageUrl(url));
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price) {
      showAlert('Data Belum Lengkap', 'Nama menu dan harga jual wajib diisi!', 'warning');
      return;
    }

    const payload = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: productForm.name.trim(),
      categoryId: productForm.categoryId,
      price: Number(productForm.price),
      costPrice: Number(productForm.costPrice) || 0,
      imageUrl: productForm.imageUrl.trim(),
      description: productForm.description.trim(),
      isAvailable: productForm.isAvailable,
    };

    onSaveProduct(payload);
    setIsProductModalOpen(false);
    showToast(editingProduct ? 'Menu berhasil diperbarui' : 'Menu baru berhasil ditambahkan', 'success');
  };

  // --- Handlers for Categories ---
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatForm({
      name: '',
      icon: 'Coffee',
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      icon: cat.icon || 'Coffee',
    });
    setIsCatModalOpen(true);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showAlert('Data Belum Lengkap', 'Nama kategori tidak boleh kosong!', 'warning');
      return;
    }

    const slug = editingCategory 
      ? editingCategory.id 
      : catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;

    const payload = {
      id: slug,
      name: catForm.name.trim(),
      icon: catForm.icon || 'Coffee',
    };

    onSaveCategory(payload);
    setIsCatModalOpen(false);
    showToast(editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori baru berhasil ditambahkan', 'success');
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCatFilter === 'all' || p.categoryId === selectedCatFilter;
    const matchSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 bg-stone-50 overflow-y-auto p-4 sm:p-6 space-y-5">
      {/* Top Banner & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Kelola Menu & Kategori</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Atur katalog menu kopi, kelola kategori produk, harga, dan tautkan foto Google Drive.
          </p>
        </div>

        {/* Subtab Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              activeSubTab === 'products'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Daftar Menu ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              activeSubTab === 'categories'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kelola Kategori ({categories.filter(c => c.id !== 'all').length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: DAFTAR MENU PRODUK */}
      {/* ========================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCatFilter(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCatFilter === c.id
                        ? 'bg-stone-900 text-white'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu</span>
              </button>
            </div>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredProducts.map(product => {
              const imgUrl = formatDriveImageUrl(product.imageUrl);
              const categoryName = categories.find(c => c.id === product.categoryId)?.name || product.categoryId;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs flex gap-3.5 items-center justify-between group hover:border-amber-300 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-700 bg-amber-50">
                        <Coffee className="w-6 h-6" />
                      </div>
                    )}
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white bg-rose-600 px-1 py-0.5 rounded">HABIS</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mb-1">
                      {categoryName}
                    </span>
                    <h3 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                      {product.name}
                    </h3>
                    <p className="text-amber-900 font-extrabold text-xs sm:text-sm mt-0.5">
                      {formatRupiah(product.price)}
                    </p>
                    {product.costPrice > 0 && (
                      <p className="text-[10px] text-stone-400">Modal: {formatRupiah(product.costPrice)}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      type="button"
                      onClick={() => onToggleAvailability(product.id)}
                      title={product.isAvailable !== false ? 'Klik untuk tandai Habis' : 'Klik untuk tandai Tersedia'}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                        product.isAvailable !== false
                          ? 'text-emerald-700 hover:bg-emerald-50'
                          : 'text-stone-400 hover:bg-stone-100'
                      }`}
                    >
                      {product.isAvailable !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditProduct(product)}
                        className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Menu"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: 'Hapus Menu',
                            message: `Yakin ingin menghapus menu "${product.name}"? Menu ini tidak akan muncul lagi di kasir.`,
                            confirmText: 'Ya, Hapus',
                            type: 'danger',
                            onConfirm: () => {
                              onDeleteProduct(product.id);
                              showToast(`Menu "${product.name}" berhasil dihapus`, 'success');
                            }
                          });
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: KELOLA KATEGORI MENU (CRUD KATEGORI) */}
      {/* ========================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-600">
              Kategori mempermudah kasir menemukan menu kopi, minuman, dan makanan di layar kasir.
            </p>
            <button
              onClick={handleOpenAddCategory}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((cat) => {
              const isAllCat = cat.id === 'all';
              const itemCount = isAllCat 
                ? products.length 
                : products.filter(p => p.categoryId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex items-center justify-between gap-3 group hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      {getCategoryIconComponent(cat.icon)}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        {isAllCat && (
                          <span className="text-[10px] bg-stone-100 text-stone-500 font-normal px-1.5 py-0.5 rounded">
                            Sistem
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {itemCount} menu terdaftar
                      </p>
                    </div>
                  </div>

                  {!isAllCat && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-2 text-stone-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT KATEGORI */}
      {/* ========================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-100">
                {editingCategory ? 'Edit Kategori Menu' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Signature Mocktail, Manual Brew..."
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  autoFocus
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">Pilih Ikon Kategori</label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_ICONS.map((iconItem) => {
                    const isSelected = catForm.icon === iconItem.id;
                    const IconComp = iconItem.component;
                    return (
                      <button
                        key={iconItem.id}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, icon: iconItem.id })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-800 text-amber-900 font-bold ring-1 ring-amber-800'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[10px] truncate max-w-full">{iconItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 py-2.5 text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 text-white bg-amber-800 hover:bg-amber-900 rounded-xl font-bold shadow-md transition-colors"
                >
                  {editingCategory ? 'Perbarui Kategori' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT PRODUK */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-100">
                {editingProduct ? 'Edit Menu Kopi' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Es Kopi Susu Pandan"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm"
                />
              </div>

              {/* Kategori with Quick Add link */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-stone-700">Kategori Menu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      setActiveSubTab('categories');
                      handleOpenAddCategory();
                    }}
                    className="text-[10px] text-amber-800 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Buat Kategori Baru</span>
                  </button>
                </div>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm"
                >
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    placeholder="20000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Harga Modal / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="8000"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Foto Menu Options */}
              <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="block font-semibold text-stone-700">Foto Menu</label>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageMode('gdrive')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      imageMode === 'gdrive'
                        ? 'bg-white shadow-xs text-amber-900 border border-amber-300'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Link Google Drive / URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      imageMode === 'upload'
                        ? 'bg-white shadow-xs text-amber-900 border border-amber-300'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto File</span>
                  </button>
                </div>

                {imageMode === 'gdrive' ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Paste link Google Drive (https://drive.google.com/file/d/...)"
                      value={productForm.imageUrl}
                      onChange={(e) => handleDriveUrlChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      💡 Cukup paste link 'Bagikan' (Share) dari Google Drive. Aplikasi otomatis mengonversinya.
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-stone-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                    />
                  </div>
                )}

                {previewImage && (
                  <div className="flex items-center gap-2 pt-1">
                    <img
                      src={previewImage}
                      alt="Pratinjau"
                      className="w-14 h-14 object-cover rounded-lg border border-stone-300 shadow-2xs"
                    />
                    <span className="text-[11px] text-stone-500">Pratinjau foto siap tampil</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  placeholder="Keterangan rasa, komposisi..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <p className="font-semibold text-stone-800">Status Ketersediaan</p>
                  <p className="text-[10px] text-stone-500">Menu dapat dipesan kasir saat aktif</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isAvailable}
                    onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-800"></div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 text-white bg-amber-800 hover:bg-amber-900 rounded-xl font-bold shadow-md transition-colors"
                >
                  {editingProduct ? 'Perbarui Menu' : 'Simpan Menu Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
