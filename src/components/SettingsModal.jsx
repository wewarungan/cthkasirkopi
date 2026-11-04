import React, { useState } from 'react';
import { 
  Store, QrCode, Cloud, Save, RefreshCw, CheckCircle, AlertCircle, 
  Printer, Wifi, User, Users, Plus, Trash2, Edit2, Key, X, ShieldCheck
} from 'lucide-react';
import { formatDriveImageUrl } from '../services/defaultData';
import { testGoogleScriptConnection } from '../services/googleSheets';
import { useNotification } from '../context/NotificationContext';

export default function SettingsModal({
  settings,
  onSaveSettings,
  onResetData,
  currentUser,
  users = [],
  onSaveUser,
  onDeleteUser
}) {
  const { showToast, showAlert, showConfirm } = useNotification();
  const isOwner = currentUser?.role === 'owner';

  const [formData, setFormData] = useState({ ...settings });
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  // User Management state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    role: 'kasir',
    pin: '',
    avatar: '☕',
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('Ukuran Foto Terlalu Besar', 'Ukuran file foto maksimal 2MB agar aplikasi tetap cepat.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, qrisImageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.googleScriptUrl) {
      setTestStatus({ ok: false, message: 'Masukkan URL Google Apps Script terlebih dahulu!' });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    const res = await testGoogleScriptConnection(formData.googleScriptUrl);
    setTestStatus(res);
    setIsTesting(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedNotification(true);
    showToast('Pengaturan toko berhasil disimpan!', 'success');
    setTimeout(() => setSavedNotification(false), 2500);
  };

  // --- Handlers for User Management (Owner Only) ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      role: 'kasir',
      pin: '',
      avatar: '☕',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      role: u.role,
      pin: u.pin,
      avatar: u.avatar || (u.role === 'owner' ? '👑' : u.role === 'admin' ? '🛠️' : '☕'),
    });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.pin.trim()) {
      showAlert('Data Belum Lengkap', 'Nama dan PIN wajib diisi!', 'warning');
      return;
    }

    const payload = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: userFormData.name.trim(),
      role: userFormData.role,
      pin: userFormData.pin.trim(),
      avatar: userFormData.role === 'owner' ? '👑' : userFormData.role === 'admin' ? '🛠️' : '☕',
    };

    onSaveUser(payload);
    setIsUserModalOpen(false);
    showToast(editingUser ? `Data ${userFormData.name} diperbarui` : `Pengguna ${userFormData.name} ditambahkan`, 'success');
  };

  const qrisPreview = formatDriveImageUrl(formData.qrisImageUrl);

  return (
    <div className="flex-1 bg-[#f8f5f0] overflow-y-auto p-3.5 sm:p-6 space-y-5 max-w-5xl mx-auto w-full font-sans text-stone-800">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Pengaturan Kedai, Struk & Pengguna</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Atur identitas coffee shop, Wi-Fi pelanggan, ukuran printer, kelola kasir, dan QRIS.
          </p>
        </div>

        {savedNotification && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* KHUSUS OWNER: KELOLA PENGGUNA (MANAJEMEN KASIR & ADMIN) */}
      {/* ========================================================= */}
      {isOwner && (
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#f2eae0] text-[#7d5635] rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900">Kelola Pengguna (Kasir, Admin & Owner)</h3>
                <p className="text-xs text-stone-500">Tambah kasir baru, atur PIN shift, dan kelola hak akses akun.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3.5 py-2 bg-[#5c3a21] hover:bg-[#4a2e1a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kasir / User</span>
            </button>
          </div>

          {/* List Users Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {users.map((u) => {
              const isUserOwner = u.role === 'owner';
              return (
                <div 
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-[#fcfaf7] border border-stone-200 flex items-center justify-between gap-3 group hover:border-[#b58e6d] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{u.avatar || '☕'}</span>
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm">{u.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          u.role === 'owner' 
                            ? 'bg-amber-100 text-amber-900' 
                            : u.role === 'admin' 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">PIN: {u.pin}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(u)}
                      className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded-lg transition-colors"
                      title="Edit Nama / PIN"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isUserOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          showConfirm({
                            title: 'Hapus Akun Pengguna',
                            message: `Yakin ingin menghapus user kasir "${u.name}"?`,
                            confirmText: 'Ya, Hapus',
                            type: 'danger',
                            onConfirm: () => {
                              onDeleteUser(u.id);
                            }
                          });
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Kasir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FORM PENGATURAN UMUM & STRUK */}
      {/* ========================================================= */}
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* CARD 1: PENGATURAN STRUK & PRINTER THERMAL */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#f2eae0] text-[#7d5635] rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900">Pengaturan Struk & Printer Thermal</h3>
                <p className="text-xs text-stone-500">Sesuaikan informasi yang tercetak di kertas struk pelanggan.</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200/60">
              Thermal 58mm / 80mm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Nama Kedai Kopi (Header Struk) *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="Contoh: KOPI KITA"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Slogan / Sub-Judul Kedai</label>
              <input
                type="text"
                value={formData.storeSlogan || ''}
                onChange={(e) => setFormData({ ...formData, storeSlogan: e.target.value })}
                placeholder="Contoh: Warung Kopi Premium"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Alamat Kedai Kopi</label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                placeholder="Contoh: Jl. Merdeka No. 12"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Awalan No. Struk (Prefix Invoice)</label>
              <input
                type="text"
                value={formData.invoicePrefix || 'KK'}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="Contoh: KK (menghasilkan KK85762642)"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Ukuran Kertas Printer Thermal</label>
              <select
                value={formData.printerWidth || '58mm'}
                onChange={(e) => setFormData({ ...formData, printerWidth: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-bold"
              >
                <option value="58mm">58mm (Printer Mini Bluetooth Portabel)</option>
                <option value="80mm">80mm (Printer Kasir Besar / USB)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Nama Wi-Fi Kedai (SSID)</label>
              <input
                type="text"
                value={formData.wifiName || ''}
                onChange={(e) => setFormData({ ...formData, wifiName: e.target.value })}
                placeholder="Contoh: KopiKita_Free"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Password Wi-Fi Pelanggan</label>
              <input
                type="text"
                value={formData.wifiPass || ''}
                onChange={(e) => setFormData({ ...formData, wifiPass: e.target.value })}
                placeholder="Contoh: kopienak123"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-mono"
              />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.showWifiOnReceipt !== false}
                  onChange={(e) => setFormData({ ...formData, showWifiOnReceipt: e.target.checked })}
                  className="rounded text-[#5c3a21] focus:ring-[#5c3a21] w-4 h-4"
                />
                <span className="font-semibold text-stone-700">Cetak Informasi Wi-Fi di Bagian Bawah Struk</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.showCustomerOnReceipt !== false}
                  onChange={(e) => setFormData({ ...formData, showCustomerOnReceipt: e.target.checked })}
                  className="rounded text-[#5c3a21] focus:ring-[#5c3a21] w-4 h-4"
                />
                <span className="font-semibold text-stone-700">Cetak Nama Pelanggan / Nomor Meja</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-stone-700 mb-1">Pesan Penutup Struk (Footer Text)</label>
              <textarea
                rows="2"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                placeholder="Contoh: Terima kasih atas kunjungan Anda\n~ Kopi Kita ~"
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: PENGATURAN QRIS PEMBAYARAN */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 bg-[#f2eae0] text-[#7d5635] rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900">Pengaturan QRIS Pembayaran</h3>
              <p className="text-xs text-stone-500">Gambar QRIS toko yang akan tampil di layar kasir.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Merchant QRIS</label>
                <input
                  type="text"
                  value={formData.qrisMerchantName}
                  onChange={(e) => setFormData({ ...formData, qrisMerchantName: e.target.value })}
                  placeholder="Contoh: KOPI KITA COFFEE SHOP"
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Link Gambar QRIS (Google Drive / URL)</label>
                <input
                  type="text"
                  value={formData.qrisImageUrl}
                  onChange={(e) => setFormData({ ...formData, qrisImageUrl: e.target.value })}
                  placeholder="Paste link Google Drive atau URL gambar QRIS toko Anda"
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Atau Upload Gambar QRIS Langsung dari File:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-stone-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#ede7df] file:text-stone-800 hover:file:bg-[#dfd7cc]"
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 bg-[#f8f5f0] border border-stone-200 rounded-2xl">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Pratinjau QRIS Kasir</span>
              <div className="w-32 h-32 bg-white p-2 rounded-xl border border-stone-300 shadow-2xs flex items-center justify-center overflow-hidden">
                {qrisPreview ? (
                  <img
                    src={qrisPreview}
                    alt="Preview QRIS"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_DEMO_KASIR';
                    }}
                  />
                ) : (
                  <QrCode className="w-10 h-10 text-stone-300" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: DATABASE CLOUD GOOGLE SHEETS (HANYA OWNER) */}
        {isOwner && (
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#f2eae0] text-[#7d5635] rounded-xl">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Database Cloud: Google Sheets</h3>
                  <p className="text-xs text-stone-500">Data kasir otomatis tercatat di Google Sheets di Google Drive Anda.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                100% Gratis
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  URL Aplikasi Web Google Apps Script (berakhiran <code className="text-[#5c3a21] bg-amber-50 px-1 py-0.5 rounded font-mono">/exec</code>):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={formData.googleScriptUrl}
                    onChange={(e) => setFormData({ ...formData, googleScriptUrl: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2.5 bg-[#5c3a21] hover:bg-[#4a2e1a] text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji...' : 'Tes Koneksi'}</span>
                  </button>
                </div>
              </div>

              {testStatus && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                  testStatus.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="flex items-center justify-between pt-2">
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                showConfirm({
                  title: 'Reset Semua Data',
                  message: 'Yakin ingin mereset seluruh data kembali ke setelan awal pabrik? Seluruh transaksi, menu tambahan, dan histori akan kembali ke awal.',
                  confirmText: 'Ya, Reset Semua',
                  type: 'danger',
                  onConfirm: () => {
                    onResetData();
                  }
                });
              }}
              className="text-xs text-stone-400 hover:text-rose-600 underline font-medium"
            >
              Reset Semua Data ke Contoh Awal
            </button>
          )}

          <button
            type="submit"
            className="px-6 py-3.5 bg-[#5c3a21] hover:bg-[#4a2e1a] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT USER KASIR & ADMIN */}
      {/* ========================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="p-4 bg-[#5c3a21] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-100">
                {editingUser ? 'Edit Akun Pengguna' : 'Tambah Kasir / User Baru'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-stone-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Kasir / Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian, Dinda, Barista Pagi..."
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Peran (Role) *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-bold"
                >
                  <option value="kasir">Kasir (Hanya akses Kasir & Riwayat Shift)</option>
                  <option value="admin">Admin (Akses Kasir, Menu, dan Operasional)</option>
                  {editingUser?.role === 'owner' && (
                    <option value="owner">Owner (Akses Penuh Finansial & Sistem)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  PIN Keamanan (4–6 Digit Angka) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1234 atau 5678"
                  value={userFormData.pin}
                  onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5c3a21] font-mono font-bold text-stone-900 text-sm tracking-wider"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  PIN ini digunakan kasir saat memilih namanya di layar login.
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 text-white bg-[#5c3a21] hover:bg-[#4a2e1a] rounded-xl font-bold shadow-md transition-colors"
                >
                  {editingUser ? 'Perbarui Akun' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
