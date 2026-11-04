import React, { useState, useEffect } from 'react';
import { Coffee, ShoppingCart, Sun, Moon, RefreshCw, LogOut, Utensils, Settings, BarChart3, FileText } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  cartCount, 
  onOpenMobileCart, 
  storeName, 
  isCloudConnected,
  pendingSyncCount,
  onSyncNow,
  isSyncing,
  currentUser,
  onOpenSwitchUser,
  openTablesCount = 0,
  onOpenTableList,
}) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('pos_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('pos_dark_mode', nextMode.toString());
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Role permissions for tabs
  const userRole = currentUser?.role || 'kasir';
  const canViewReports = userRole === 'owner'; // Only owner can see full financial reports
  const canManageMenu = userRole === 'owner' || userRole === 'admin';
  const canViewSettings = userRole === 'owner' || userRole === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-[#fdfbf9] dark:bg-[#1a1714] border-b border-stone-200/90 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Brand / Logo (Responsive: Nama toko tidak akan memecahkan layout walau panjang) */}
        <div 
          onClick={() => setActiveTab('pos')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group min-w-0 flex-1 md:flex-initial"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-[#5c3a21] text-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <Coffee className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 pr-1">
            <h1 
              className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-stone-900 dark:text-stone-100 leading-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-xs"
              title={storeName || 'Kopi Kita'}
            >
              {storeName || 'Kopi Kita'}
            </h1>
          </div>
        </div>

        {/* Navigation Tabs (Tablet & Desktop Only - Di HP dipindah ke Bottom Navigation) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {/* Kasir tab is available for everyone */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'pos'
                ? 'bg-[#5c3a21] text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#ede7df] dark:hover:bg-stone-800'
            }`}
          >
            Kasir
          </button>

          {/* Laporan / Riwayat Tab */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-[#5c3a21] text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#ede7df] dark:hover:bg-stone-800'
            }`}
          >
            {canViewReports ? 'Laporan' : 'Riwayat'}
          </button>

          {/* Kelola Menu Tab (Admin & Owner) */}
          {canManageMenu && (
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-[#5c3a21] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#ede7df] dark:hover:bg-stone-800'
              }`}
            >
              Menu
            </button>
          )}

          {/* Pengaturan Tab (Admin & Owner) */}
          {canViewSettings && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-[#5c3a21] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#ede7df] dark:hover:bg-stone-800'
              }`}
              title="Pengaturan Kedai"
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </button>
          )}
        </nav>

        {/* Right User Profil & Actions (Lega, Rapi, dan Tidak Terpotong) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Open Tables Pill Button */}
          {openTablesCount > 0 && (
            <button
              onClick={onOpenTableList}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all border border-amber-300 dark:border-amber-800 active:scale-95 shadow-2xs"
              title="Lihat Meja Aktif (Pesanan Belum Bayar)"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
              <span className="hidden sm:inline">Meja:</span>
              <span className="bg-amber-800 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">{openTablesCount}</span>
            </button>
          )}

          {/* Cloud Sync Status */}
          {pendingSyncCount > 0 && (
            <button 
              onClick={onSyncNow}
              disabled={isSyncing}
              title="Ada transaksi offline, klik untuk sinkronkan ke Google Sheets"
              className="text-[#7d5635] dark:text-amber-200 bg-[#f2eae0] dark:bg-stone-800 px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-[11px] font-bold border border-stone-200/70 dark:border-stone-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Sync</span>
              <span className="bg-[#7d5635] text-white px-1.5 py-0.2 rounded-full text-[10px]">{pendingSyncCount}</span>
            </button>
          )}

          {/* Dark Mode Icon Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 sm:p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-[#ede7df] dark:hover:bg-stone-800 transition-colors"
            title="Ganti Tema Gelap / Terang"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Active User Badge & Switch Button (Jelas & Terlihat di HP Maupun Laptop) */}
          {currentUser && (
            <button
              onClick={onOpenSwitchUser}
              title={`Kasir Aktif: ${currentUser.name} (${currentUser.role}). Klik untuk Ganti Kasir / Keluar.`}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#ede7df] dark:bg-stone-800 hover:bg-[#dfd7cc] dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-colors border border-stone-200/80 dark:border-stone-700 active:scale-95 shrink-0"
            >
              <span className="text-sm leading-none">{currentUser.avatar || '☕'}</span>
              <span className="hidden sm:inline font-semibold">{currentUser.name}</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal hidden lg:inline">({currentUser.role})</span>
              <LogOut className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
            </button>
          )}

          {/* Mobile Cart Trigger di Navbar */}
          {activeTab === 'pos' && (
            <button
              onClick={onOpenMobileCart}
              className="lg:hidden relative p-2 sm:p-2.5 rounded-xl bg-[#5c3a21] text-white hover:bg-[#4a2e1a] shadow-xs transition-transform active:scale-95 shrink-0"
              aria-label="Lihat Keranjang"
              title="Lihat Keranjang Belanja"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#b05d49] text-white rounded-full text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-stone-900">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
