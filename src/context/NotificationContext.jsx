import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, Trash2, X, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  // Toast state
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' | 'warning' }
  const [toastTimer, setToastTimer] = useState(null);

  // Modal Dialog state (Confirm or Alert)
  const [dialog, setDialog] = useState(null); 
  // { isOpen, isConfirm, title, message, confirmText, cancelText, type: 'danger' | 'warning' | 'info' | 'success', onConfirm }

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    setToastTimer(timer);
  }, [toastTimer]);

  const hideToast = useCallback(() => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast(null);
  }, [toastTimer]);

  const showAlert = useCallback((title, message, type = 'info') => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        isConfirm: false,
        title,
        message,
        confirmText: 'Mengerti',
        type,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
      });
    });
  }, []);

  const showConfirm = useCallback(({
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'danger',
    onConfirm
  }) => {
    setDialog({
      isOpen: true,
      isConfirm: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: () => {
        setDialog(null);
        if (onConfirm) onConfirm();
      },
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, showAlert, showConfirm }}>
      {children}

      {/* Modern Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto max-w-md w-[90%] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md select-none ${
            toast.type === 'error' || toast.type === 'danger'
              ? 'bg-rose-900/95 text-white border-rose-700/80'
              : toast.type === 'warning'
              ? 'bg-amber-900/95 text-white border-amber-700/80'
              : toast.type === 'info'
              ? 'bg-stone-900/95 text-white border-stone-700/80'
              : 'bg-[#3d2b1f]/95 text-white border-amber-800/80'
          }`}>
            <div className="shrink-0">
              {toast.type === 'error' || toast.type === 'danger' ? (
                <AlertCircle className="w-5 h-5 text-rose-300" />
              ) : toast.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-300" />
              ) : toast.type === 'info' ? (
                <Info className="w-5 h-5 text-blue-300" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold tracking-wide flex-1">
              {toast.message}
            </p>

            <button 
              onClick={hideToast}
              className="text-stone-300 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Confirm / Alert Dialog */}
      {dialog && dialog.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-[#fcfaf7] dark:bg-[#211c19] text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 w-full max-w-sm sm:max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            
            {/* Header Icon + Title */}
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${
                dialog.type === 'danger'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : dialog.type === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : dialog.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700'
              }`}>
                {dialog.type === 'danger' ? (
                  <Trash2 className="w-6 h-6 stroke-[2.2]" />
                ) : dialog.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                ) : dialog.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <Info className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
                  {dialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed whitespace-pre-line">
                  {dialog.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              {dialog.isConfirm && (
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold transition-all active:scale-95"
                >
                  {dialog.cancelText || 'Batal'}
                </button>
              )}

              <button
                type="button"
                autoFocus
                onClick={dialog.onConfirm}
                className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${
                  dialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : dialog.type === 'warning'
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : dialog.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#5c3a21] hover:bg-[#4a2e1a]'
                }`}
              >
                {dialog.confirmText}
              </button>
            </div>

          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
