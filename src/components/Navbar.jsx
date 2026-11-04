import React, { useState, useEffect } from 'react';
import { Coffee, ShoppingCart, Sun, Moon, RefreshCw, LogOut, UserCheck, Utensils } from 'lucide-react';

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
  const canViewHistory = userRole === 'kasir' || userRole === 'admin'; // Cashier/admin see shift history
  const canManageMenu = userRole === 'owner' || userRole === 'admin';
  const canViewSettings = userRole === 'owner' || userRole === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-[#fdfbf9] border-b border-stone-200/90 text-stone-900 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('pos')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#5c3a21] text-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <Coffee className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-stone-900 leading-tight">
              {storeName || 'Kopi Kita'}
            </h1>
          </div>
        </div>

        {/* Navigation Tabs (Filtered by Role) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Kasir tab is available for everyone */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'pos'
                ? 'bg-[#5c3a21] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-[#ede7df]'
            }`}
          >
            Kasir
          </button>

          {/* Laporan Tab (Owner sees full reports, Cashier/Admin sees Riwayat) */}
          {canViewReports ? (
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#5c3a21] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#ede7df]'
              }`}
            >
              Laporan
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#5c3a21] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#ede7df]'
              }`}
            >
              Riwayat
            </button>
          )}

          {/* Kelola Menu Tab (Admin & Owner) */}
          {canManageMenu && (
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-[#5c3a21] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#ede7df]'
              }`}
            >
              Menu
            </button>
          )}

          {/* Pengaturan Tab (Admin & Owner) */}
          {canViewSettings && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`hidden sm:inline-block px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#5c3a21] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#ede7df]'
              }`}
            >
              Pengaturan
            </button>
          )}
        </nav>

        {/* Right User Profil & Actions */}
        <div className="flex items-center gap-2">
          {/* Open Tables Pill Button */}
          {openTablesCount > 0 && (
            <button
              onClick={onOpenTableList}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-amber-100/90 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all border border-amber-300 active:scale-95 shadow-2xs"
              title="Lihat Meja Aktif (Pesanan Belum Bayar)"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden sm:inline">Meja Aktif:</span>
              <span className="bg-amber-800 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">{openTablesCount}</span>
            </button>
          )}

          {/* Cloud Sync Status */}
          {pendingSyncCount > 0 && (
            <button 
              onClick={onSyncNow}
              disabled={isSyncing}
              title="Ada transaksi offline, klik untuk sinkronkan ke Google Sheets"
              className="text-[#7d5635] bg-[#f2eae0] px-2.5 py-1 rounded-xl flex items-center gap-1 text-[11px] font-bold"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync ({pendingSyncCount})</span>
            </button>
          )}

          {/* Dark Mode Icon Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-2xl border border-stone-200 text-stone-700 hover:bg-[#ede7df] transition-colors"
            title="Ganti Tema Gelap / Terang"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Active User Badge & Switch Button */}
          {currentUser && (
            <button
              onClick={onOpenSwitchUser}
              title="Klik untuk Ganti Kasir / Keluar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#ede7df] hover:bg-[#dfd7cc] text-stone-800 text-xs font-bold transition-colors border border-stone-200/80 active:scale-95"
            >
              <span>{currentUser.avatar || '☕'}</span>
              <span className="hidden md:inline">{currentUser.name}</span>
              <span className="text-[10px] text-stone-500 font-normal hidden lg:inline">({currentUser.role})</span>
              <LogOut className="w-3.5 h-3.5 text-stone-500 ml-0.5" />
            </button>
          )}

          {/* Mobile Cart Trigger */}
          {activeTab === 'pos' && (
            <button
              onClick={onOpenMobileCart}
              className="lg:hidden relative p-2.5 rounded-2xl bg-[#5c3a21] text-white hover:bg-[#4a2e1a] shadow-xs transition-transform active:scale-95"
              aria-label="Lihat Keranjang"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#b05d49] text-white rounded-full text-xs font-bold flex items-center justify-center ring-2 ring-white">
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
