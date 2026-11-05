import React, { useState, useEffect, useRef } from 'react';
import { Coffee, ArrowLeft, Delete, Keyboard, LogOut, Eye, EyeOff } from 'lucide-react';

export default function LoginModal({
  isOpen,
  users,
  onLoginSuccess,
  storeName,
  canClose = false,
  onClose,
  onLogoutKafe
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const inputRef = useRef(null);

  // Focus input when user is selected
  useEffect(() => {
    if (selectedUser) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedUser]);

  // Physical keyboard listener for Laptop/PC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // If modal can close and user presses Escape
      if (e.key === 'Escape') {
        if (selectedUser) {
          setSelectedUser(null);
          setPinInput('');
          setErrorMsg('');
        } else if (canClose && onClose) {
          onClose();
        }
        return;
      }

      // If user profile is already selected
      if (selectedUser) {
        if (e.key === 'Enter') {
          e.preventDefault();
          verifyPin(pinInput);
          return;
        }

        // If the focused element is NOT the input, still catch numbers and backspace!
        if (document.activeElement !== inputRef.current) {
          if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            handleKeyPress(e.key);
          } else if (e.key === 'Backspace') {
            e.preventDefault();
            handleDelete();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedUser, pinInput, canClose, onClose]);

  if (!isOpen) return null;

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setPinInput('');
    setErrorMsg('');
    setShowPinText(false);
  };

  const handleKeyPress = (num) => {
    if (!selectedUser) return;
    const maxLen = selectedUser.pin ? selectedUser.pin.length : 4;
    if (pinInput.length < maxLen) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      setErrorMsg('');

      // Auto submit if matches length of user PIN
      if (nextPin.length === maxLen) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg('');
  };

  const verifyPin = (pinToTest) => {
    if (!selectedUser) return;
    if (String(selectedUser.pin) === String(pinToTest)) {
      onLoginSuccess(selectedUser);
      setSelectedUser(null);
      setPinInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('PIN salah! Silakan coba lagi.');
      setPinInput('');
      inputRef.current?.focus();
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">Owner</span>;
      case 'admin':
        return <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">Admin</span>;
      default:
        return <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">Kasir</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-2xl border border-stone-200/90 animate-in zoom-in-95 flex flex-col my-auto max-h-[95vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#5c3a21] to-[#4a2e1a] text-white text-center relative shrink-0">
          {canClose && (
            <button 
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-stone-300 hover:text-white text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl transition-colors"
            >
              Tutup
            </button>
          )}

          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/15 rounded-2xl mx-auto flex items-center justify-center mb-1.5 shadow-inner border border-white/20">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200" />
          </div>
          <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-white truncate px-6">
            {storeName || 'Kopi Kita'}
          </h2>
          <p className="text-[11px] sm:text-xs text-amber-100/80 mt-0.5">
            Sistem Kasir & Manajemen Kedai Kopi
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {!selectedUser ? (
            /* STEP 1: PILIH PROFIL PENGGUNA */
            <div className="space-y-3">
              <div className="text-center pb-1">
                <h3 className="font-bold text-stone-800 text-sm sm:text-base">Pilih Profil Pengguna</h3>
                <p className="text-[11px] sm:text-xs text-stone-500">Sentuh atau klik profil akun Anda</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white border-2 border-stone-200/80 hover:border-[#5c3a21] hover:shadow-md transition-all flex flex-col items-center text-center group active:scale-95 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#f7f2ea] group-hover:bg-[#f0e6d6] flex items-center justify-center text-2xl mb-1.5 transition-colors">
                      {user.avatar || '☕'}
                    </div>
                    <span className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-[#5c3a21] transition-colors truncate max-w-full px-1">
                      {user.name}
                    </span>
                    <div className="mt-1">
                      {getRoleBadge(user.role)}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-[11px] text-amber-900 text-center">
                <span className="font-bold">💡 PIN Standar:</span><br />
                Kasir / Admin: <code className="font-mono font-bold bg-amber-100/80 px-1 rounded">1234</code> • Owner: <code className="font-mono font-bold bg-amber-100/80 px-1 rounded">123456</code>
              </div>

              {onLogoutKafe && (
                <div className="pt-2 border-t border-stone-200/80">
                  <button
                    type="button"
                    onClick={onLogoutKafe}
                    className="w-full py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Kafe (Ganti ID Kafe)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: MASUKKAN PIN */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setPinInput('');
                    setErrorMsg('');
                  }}
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-bold px-2 py-1 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ganti Akun</span>
                </button>

                <div>{getRoleBadge(selectedUser.role)}</div>
              </div>

              {/* Profile Card Info */}
              <div className="flex items-center justify-center gap-3 py-1">
                <span className="text-3xl">{selectedUser.avatar || '☕'}</span>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">{selectedUser.name}</h4>
                  <p className="text-[11px] text-stone-500">
                    Masukkan PIN {selectedUser.pin ? `${selectedUser.pin.length} digit` : ''}
                  </p>
                </div>
              </div>

              {/* PIN Input Box (Hanya 1 input bersih & modern) */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative flex items-center justify-center">
                  <input
                    ref={inputRef}
                    type={showPinText ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={selectedUser.pin ? selectedUser.pin.length : 6}
                    value={pinInput}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, selectedUser.pin ? selectedUser.pin.length : 6);
                      setPinInput(clean);
                      setErrorMsg('');
                      if (selectedUser.pin && clean.length === selectedUser.pin.length) {
                        verifyPin(clean);
                      }
                    }}
                    placeholder={Array.from({ length: selectedUser.pin ? selectedUser.pin.length : 4 }).map(() => '•').join(' ')}
                    className="w-52 text-center py-2.5 px-4 pr-10 text-2xl tracking-[0.35em] font-mono font-black bg-white border-2 border-stone-300 focus:border-[#5c3a21] rounded-2xl focus:outline-none shadow-xs transition-all text-[#5c3a21]"
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-3 text-stone-400 hover:text-stone-700 p-1.5 transition-colors cursor-pointer"
                    title={showPinText ? "Sembunyikan PIN" : "Tampilkan PIN"}
                  >
                    {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Keyboard className="w-3 h-3" />
                  <span>Ketik via keyboard fisik atau keypad di bawah</span>
                </p>
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-bold text-rose-600 animate-shake">
                  {errorMsg}
                </div>
              )}

              {/* Numeric Touch Keypad (Untuk Mobile & Tablet) */}
              <div className="grid grid-cols-3 gap-2 pt-1 select-none">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num.toString())}
                    className="py-3 sm:py-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200/90 font-extrabold text-lg text-stone-800 shadow-2xs active:scale-95 transition-transform cursor-pointer"
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClear}
                  className="py-3 sm:py-3.5 rounded-2xl bg-[#ede7df] hover:bg-[#dfd7cc] font-bold text-xs text-stone-700 active:scale-95 transition-transform cursor-pointer"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="py-3 sm:py-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200/90 font-extrabold text-lg text-stone-800 shadow-2xs active:scale-95 transition-transform cursor-pointer"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-3 sm:py-3.5 rounded-2xl bg-[#ede7df] hover:bg-[#dfd7cc] font-bold text-xs text-stone-700 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                >
                  <Delete className="w-5 h-5 text-stone-700" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => verifyPin(pinInput)}
                className="w-full py-3 bg-[#5c3a21] hover:bg-[#4a2e1a] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer mt-1"
              >
                Masuk
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
