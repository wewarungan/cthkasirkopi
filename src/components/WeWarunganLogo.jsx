import React from 'react';

export default function WeWarunganLogo({ size = 'md', showTagline = true, className = '' }) {
  // Size presets
  const sizeMap = {
    sm: { iconSize: 32, rx: 8, stroke: 2.8, textTitle: 'text-lg', textSub: 'text-[9px]' },
    md: { iconSize: 44, rx: 12, stroke: 3.5, textTitle: 'text-2xl', textSub: 'text-[10px]' },
    lg: { iconSize: 56, rx: 16, stroke: 4.2, textTitle: 'text-3xl', textSub: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Badge: Tech Square with 'W' Storefront */}
      <div 
        style={{ width: currentSize.iconSize, height: currentSize.iconSize }}
        className="relative shrink-0 rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 flex items-center justify-center shadow-md border border-indigo-500/30 overflow-hidden"
      >
        <svg 
          viewBox="0 0 60 60" 
          width="85%" 
          height="85%" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Awning Canopy (Warung) */}
          <path 
            d="M12 24 C12 24, 18 18, 30 18 C42 18, 48 24, 48 24 L48 28 C48 28, 42 24, 30 24 C18 24, 12 28, 12 28 Z" 
            fill="#fbbf24" 
          />
          {/* Bold Tech 'W' Structure */}
          <path 
            d="M15 27 L22 45 L30 31 L38 45 L45 27" 
            stroke="#ffffff" 
            strokeWidth={currentSize.stroke * 1.1} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Central Golden Tech Node */}
          <circle cx="30" cy="22" r="3" fill="#f59e0b" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-left">
        <div className={`font-black tracking-tight leading-none ${currentSize.textTitle}`}>
          <span className="text-indigo-600 dark:text-indigo-400">We</span>
          <span className="text-stone-900 dark:text-stone-100">Warungan</span>
        </div>
        {showTagline && (
          <span className={`font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400 mt-1 ${currentSize.textSub}`}>
            Digital Business Suite
          </span>
        )}
      </div>
    </div>
  );
}
