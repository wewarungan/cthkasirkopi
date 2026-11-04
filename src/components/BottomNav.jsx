import React from 'react';
import { Coffee, FileText, BarChart3, Utensils, Settings } from 'lucide-react';

export default function BottomNav({
  activeTab,
  setActiveTab,
  currentUser,
}) {
  const userRole = currentUser?.role || 'kasir';
  const canViewReports = userRole === 'owner';
  const canManageMenu = userRole === 'owner' || userRole === 'admin';
  const canViewSettings = userRole === 'owner' || userRole === 'admin';

  return (
    <nav 
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#fdfbf9]/95 dark:bg-[#1c1815]/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800/90 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.08)] select-none safe-area-bottom"
    >
      {/* 1. Kasir / POS */}
      <button
        onClick={() => setActiveTab('pos')}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
          activeTab === 'pos'
            ? 'text-[#5c3a21] dark:text-amber-300 font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-800'
        }`}
      >
        <div className={`p-1 rounded-xl transition-colors ${
          activeTab === 'pos' 
            ? 'bg-[#5c3a21] text-amber-100 shadow-xs' 
            : 'text-stone-600 dark:text-stone-400'
        }`}>
          <Coffee className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[10px] leading-tight mt-0.5">Kasir</span>
      </button>

      {/* 2. Laporan / Riwayat */}
      <button
        onClick={() => setActiveTab('reports')}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
          activeTab === 'reports'
            ? 'text-[#5c3a21] dark:text-amber-300 font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-800'
        }`}
      >
        <div className={`p-1 rounded-xl transition-colors ${
          activeTab === 'reports' 
            ? 'bg-[#5c3a21] text-amber-100 shadow-xs' 
            : 'text-stone-600 dark:text-stone-400'
        }`}>
          {canViewReports ? (
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <FileText className="w-5 h-5 stroke-[2.2]" />
          )}
        </div>
        <span className="text-[10px] leading-tight mt-0.5">
          {canViewReports ? 'Laporan' : 'Riwayat'}
        </span>
      </button>

      {/* 3. Kelola Menu (Admin & Owner) */}
      {canManageMenu && (
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'menu'
              ? 'text-[#5c3a21] dark:text-amber-300 font-bold'
              : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${
            activeTab === 'menu' 
              ? 'bg-[#5c3a21] text-amber-100 shadow-xs' 
              : 'text-stone-600 dark:text-stone-400'
          }`}>
            <Utensils className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Menu</span>
        </button>
      )}

      {/* 4. Pengaturan (Admin & Owner) */}
      {canViewSettings && (
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'settings'
              ? 'text-[#5c3a21] dark:text-amber-300 font-bold'
              : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${
            activeTab === 'settings' 
              ? 'bg-[#5c3a21] text-amber-100 shadow-xs' 
              : 'text-stone-600 dark:text-stone-400'
          }`}>
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Pengaturan</span>
        </button>
      )}
    </nav>
  );
}
