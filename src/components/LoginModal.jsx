import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Shield, KeyRound, ArrowLeft, Check, Delete, Lock, UserCheck, Keyboard, LogOut } from 'lucide-react';

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
  const mobileInputRef = useRef(null);

  // Focus mobile input whenever user selected
  useEffect(() => {
    if (selectedUser && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [selectedUser]);

  // Physical keyboard listener (Laptop/PC)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // If no user selected, press 1-9 to select user
      if (!selectedUser) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= users.length) {
          handleSelectUser(users[num - 1]);
        } else if (e.key === 'Escape' && canClose && onClose) {
          onClose();
        }
        return;
      }

      // If user selected:
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        verifyPin(pinInput);
      } else if (e.key === 'Escape') {
        setSelectedUser(null);
        setPinInput('');
        setErrorMsg('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedUser, pinInput, users, canClose, onClose]);

  if (!isOpen) return null;

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setPinInput('');
    setErrorMsg('');
  };

  const handleKeyPress = (num) => {
    if (pinInput.length < 8) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      setErrorMsg('');

      // Auto submit if matches length of user PIN
      if (selectedUser && nextPin.length === selectedUser.pin.length) {
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
    if (selectedUser.pin === pinToTest) {
      onLoginSuccess(selectedUser);
      setSelectedUser(null);
      setPinInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('PIN yang Anda masukkan salah!');
      setPinInput('');
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#fcfaf7] w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-2xl border border-stone-200/90 animate-in zoom-in-95 flex flex-col">
        
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-b from-[#5c3a21] to-[#4a2e1a] text-white text-center relative">
          {canClose && (
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-stone-300 hover:text-white text-xs bg-white/10 px-2.5 py-1 rounded-xl"
            >
              Tutup
            </button>
          )}

          <div className="w-12 h-12 bg-white/15 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-inner border border-white/20">
            <Coffee className="w-6 h-6 text-amber-200" />
          </div>
          <h2 className="font-extrabold text-lg tracking-tight text-white">
            {storeName || 'Kopi Kita'}
          </h2>
          <p className="text-xs text-amber-100/80 mt-0.5">
            Sistem Kasir & Manajemen Kedai Kopi
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {!selectedUser ? (
            /* STEP 1: PILIH PROFIL PENGGUNA */
            <div className="space-y-3">
              <div className="text-center pb-1">
                <h3 className="font-bold text-stone-800 text-sm">Pilih Pengguna untuk Masuk</h3>
                <p className="text-[11px] text-stone-500">Klik nama Anda untuk memasukkan PIN</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-[#5c3a21] hover:shadow-md transition-all flex flex-col items-center text-center group active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#f7f2ea] group-hover:bg-[#f0e6d6] flex items-center justify-center text-2xl mb-2 transition-colors">
                      {user.avatar || '☕'}
                    </div>
                    <span className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-[#5c3a21] transition-colors">
                      {user.name}
                    </span>
                    <div className="mt-1">
                      {getRoleBadge(user.role)}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-[11px] text-amber-900 text-center">
                <span className="font-bold">💡 PIN Demo Default:</span><br />
                Kasir (Budi / Siti): <code className="font-mono font-bold">1234</code><br />
                Admin: <code className="font-mono font-bold">1234</code> • Owner: <code className="font-mono font-bold">123456</code>
              </div>
              {onLogoutKafe && (
                <div className="pt-2 border-t border-stone-200/80">
                  <button
                    type="button"
                    onClick={onLogoutKafe}
                    className="w-full py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Kafe (Ganti ID Kafe)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: KEYPAD PIN */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ganti Profil</span>
                </button>

                <div>{getRoleBadge(selectedUser.role)}</div>
              </div>

              {/* Profile Card Header */}
              <div className="flex items-center justify-center gap-2.5 py-1">
                <span className="text-2xl">{selectedUser.avatar || '☕'}</span>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">{selectedUser.name}</h4>
                  <p className="text-[11px] text-stone-500">Masukkan PIN keamanan Anda</p>
                </div>
              </div>

              {/* PIN Dots Display & Hidden Input for Mobile Keypad */}
              <div 
                onClick={() => mobileInputRef.current?.focus()} 
                className="cursor-pointer relative flex flex-col items-center justify-center py-2"
                title="Klik untuk membuka keyboard ponsel"
              >
                <input
                  ref={mobileInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={selectedUser.pin.length}
                  value={pinInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setPinInput(clean);
                    setErrorMsg('');
                    if (clean.length === selectedUser.pin.length) {
                      verifyPin(clean);
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none w-1 h-1 -top-10"
                />

                <div className="flex justify-center items-center gap-3 py-1">
                  {Array.from({ length: selectedUser.pin.length }).map((_, idx) => {
                    const isFilled = idx < pinInput.length;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                          isFilled 
                            ? 'bg-[#5c3a21] scale-110 shadow-xs ring-2 ring-amber-300' 
                            : 'bg-stone-300'
                        }`}
                      ></div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                  <Keyboard className="w-3 h-3" />
                  <span>Bisa ketik langsung via keyboard laptop atau HP</span>
                </p>
              </div>

              {errorMsg && (
                <p className="text-center text-xs font-bold text-rose-600 animate-bounce">
                  {errorMsg}
                </p>
              )}

              {/* Numeric Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num.toString())}
                    className="py-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200/90 font-extrabold text-lg text-stone-800 shadow-2xs active:scale-95 transition-transform"
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClear}
                  className="py-3.5 rounded-2xl bg-[#ede7df] hover:bg-[#dfd7cc] font-bold text-xs text-stone-700 active:scale-95 transition-transform"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="py-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200/90 font-extrabold text-lg text-stone-800 shadow-2xs active:scale-95 transition-transform"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-3.5 rounded-2xl bg-[#ede7df] hover:bg-[#dfd7cc] font-bold text-xs text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Delete className="w-5 h-5 text-stone-700" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => verifyPin(pinInput)}
                className="w-full py-3 bg-[#5c3a21] hover:bg-[#4a2e1a] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98"
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
