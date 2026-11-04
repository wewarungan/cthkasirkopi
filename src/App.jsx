import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import PosTerminal from './components/PosTerminal';
import CartSidebar from './components/CartSidebar';
import PaymentModal from './components/PaymentModal';
import ReceiptThermal from './components/ReceiptThermal';
import MenuManager from './components/MenuManager';
import ReportsHistory from './components/ReportsHistory';
import SettingsModal from './components/SettingsModal';
import OpenTablesModal from './components/OpenTablesModal';
import LoginModal from './components/LoginModal';
import ExpenseModal from './components/ExpenseModal';
import MasterLoginPage from './components/MasterLoginPage';
import { useNotification } from './context/NotificationContext';
import { 
  getMasterSession, 
  setMasterSession, 
  clearMasterSession,
  getOrCreateDeviceId,
  verifyDeviceWithMaster
} from './services/masterAuth';

import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_SETTINGS,
  INITIAL_USERS 
} from './services/defaultData';
import { 
  STORAGE_KEYS, 
  getLocalData, 
  setLocalData, 
  syncTransactionToGoogleSheets,
  processPendingSync,
  fetchCloudTransactions,
  syncExpenseToGoogleSheets,
  fetchCloudExpenses,
  syncMenuToGoogleSheets,
  fetchCloudMenu,
  syncOpenTablesToGoogleSheets,
  fetchCloudOpenTables
} from './services/googleSheets';

export default function App() {
  const { showToast, showAlert, showConfirm } = useNotification();

  // Navigation State
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'reports', 'menu', 'settings'

  // Master Kafe Session State
  const [masterSession, setMasterSessionState] = useState(() => getMasterSession());

  // Persistent States with Auto-Sanitizer for Clean Data
  const [products, setProducts] = useState(() => {
    const saved = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const seen = new Set();
    const hasDup = Array.isArray(saved) && saved.some(p => {
      if (seen.has(p.id)) return true;
      seen.add(p.id);
      return false;
    });
    return hasDup ? INITIAL_PRODUCTS : saved;
  });

  const [categories, setCategories] = useState(() => {
    const saved = getLocalData(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const hasBundling = Array.isArray(saved) && saved.some(c => c.id === 'bundling');
    return hasBundling ? saved : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState(() => getLocalData(STORAGE_KEYS.TRANSACTIONS, []));
  const [settings, setSettings] = useState(() => getLocalData(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
  const [users, setUsers] = useState(() => getLocalData(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState(() => getLocalData(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]));
  const [openTables, setOpenTables] = useState(() => getLocalData(STORAGE_KEYS.OPEN_TABLES, []));
  const [expenses, setExpenses] = useState(() => getLocalData(STORAGE_KEYS.EXPENSES, []));

  // Cart & Order State
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState('Dine In'); // 'Dine In' or 'Take Away'
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);

  // Modals
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentReceiptTx, setCurrentReceiptTx] = useState(null);
  const [isOpenTablesModalOpen, setIsOpenTablesModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Sync state
  const [pendingSync, setPendingSync] = useState(() => getLocalData(STORAGE_KEYS.PENDING_SYNC, []));
  const [isSyncing, setIsSyncing] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.OPEN_TABLES, openTables);
  }, [openTables]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);

  // ---------------------------------------------------------------------------
  // 1. Verifikasi Keabsahan Perangkat ke Master Lisensi (Auto-Kickout jika dihapus)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!masterSession?.idKafe) return;

    let isMounted = true;
    const verifyDevice = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const res = await verifyDeviceWithMaster(masterSession.idKafe, deviceId);
        if (!isMounted) return;

        if (res && res.valid === false) {
          clearMasterSession();
          setMasterSessionState(null);
          showAlert(
            'Akses Perangkat Dicabut',
            res.message || 'Perangkat ini telah dicabut atau direset dari Master Lisensi Kafe di spreadsheet.',
            'error'
          );
        }
      } catch (err) {
        // Offline-First: Izinkan kasir tetap jualan jika internet putus sementara
        console.warn('Verifikasi perangkat offline (diizinkan):', err);
      }
    };

    verifyDevice();
    const timer = setInterval(verifyDevice, 60000); // Cek setiap 60 detik
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [masterSession?.idKafe]);

  // ---------------------------------------------------------------------------
  // 2. Sinkronisasi Penuh Multi-Device Cloud (Push & Pull)
  // ---------------------------------------------------------------------------
  const syncAllCloudData = async ({ silent = true } = {}) => {
    if (!settings.googleScriptUrl) return;

    try {
      // A. Kirim transaksi offline yang tertunda
      await processPendingSync(settings.googleScriptUrl);
      setPendingSync(getLocalData(STORAGE_KEYS.PENDING_SYNC, []));

      // B. Tarik transaksi dari cloud (agar Laptop Owner melihat transaksi HP Kasir)
      const cloudTx = await fetchCloudTransactions(settings.googleScriptUrl);
      if (Array.isArray(cloudTx) && cloudTx.length > 0) {
        setTransactions(prevLocal => {
          const map = new Map();
          cloudTx.forEach(t => map.set(t.invoiceNumber, t));
          // Pertahankan detail lokal jika ada
          prevLocal.forEach(t => {
            if (map.has(t.invoiceNumber)) {
              const c = map.get(t.invoiceNumber);
              map.set(t.invoiceNumber, {
                ...c,
                items: (t.items && t.items.length > 0) ? t.items : c.items,
                dailyIndex: t.dailyIndex || c.dailyIndex,
                queueNumber: t.queueNumber || c.queueNumber,
              });
            } else {
              map.set(t.invoiceNumber, t);
            }
          });

          return Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00:00'}`).getTime();
            const timeB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00:00'}`).getTime();
            return timeB - timeA;
          });
        });
      }

      // C. Tarik katalog menu dari cloud jika ada update harga dari Laptop Owner
      const cloudMenu = await fetchCloudMenu(settings.googleScriptUrl);
      if (Array.isArray(cloudMenu) && cloudMenu.length > 0) {
        setProducts(prevLocal => {
          const cMap = new Map();
          cloudMenu.forEach(p => cMap.set(p.id, p));
          const updated = prevLocal.map(lp => {
            if (cMap.has(lp.id)) {
              const cp = cMap.get(lp.id);
              cMap.delete(lp.id);
              return { ...lp, ...cp };
            }
            return lp;
          });
          cMap.forEach(cp => updated.push(cp));
          return updated;
        });
      }

      // D. Tarik kas keluar (pengeluaran petty cash) dari cloud
      const cloudExpenses = await fetchCloudExpenses(settings.googleScriptUrl);
      if (Array.isArray(cloudExpenses) && cloudExpenses.length > 0) {
        setExpenses(prevLocal => {
          const expMap = new Map();
          cloudExpenses.forEach(e => expMap.set(e.id, e));
          prevLocal.forEach(e => {
            if (!expMap.has(e.id)) expMap.set(e.id, e);
          });
          return Array.from(expMap.values()).sort((a, b) => {
            const timeA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00:00'}`).getTime();
            const timeB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00:00'}`).getTime();
            return timeB - timeA;
          });
        });
      }

      // E. Tarik meja aktif (Open Table) dari cloud
      const cloudTables = await fetchCloudOpenTables(settings.googleScriptUrl);
      if (Array.isArray(cloudTables) && cloudTables.length > 0) {
        setOpenTables(cloudTables);
      }

      if (!silent) {
        showToast('Sinkronisasi Cloud Berhasil! Semua data telah mutakhir.', 'success');
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi data cloud:', err);
      if (!silent) {
        showToast('Gagal sinkronisasi: ' + (err.message || 'Koneksi internet bermasalah'), 'error');
      }
    }
  };

  // Background Cloud Sync setiap 60 detik
  useEffect(() => {
    if (!settings.googleScriptUrl) return;

    syncAllCloudData({ silent: true });
    const syncInterval = setInterval(() => {
      syncAllCloudData({ silent: true });
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [settings.googleScriptUrl]);

  // Add item to cart
  const [addedItemToast, setAddedItemToast] = useState(null);

  const handleAddToCart = (product) => {
    if (!product) return;
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id && !item.notes);
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], qty: copy[existingIdx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          cartItemId: `${product.id}-${Date.now()}`,
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          costPrice: Number(product.costPrice) || 0,
          imageUrl: product.imageUrl || '',
          qty: 1,
          notes: '',
        }
      ];
    });

    setAddedItemToast(`${product.name} (+1)`);
    setTimeout(() => setAddedItemToast(null), 2000);
  };

  const handleUpdateQty = (cartItemId, delta) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if ((item.cartItemId || item.id) === cartItemId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveItem = (cartItemId) => {
    setCartItems(prev => prev.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  const handleUpdateNotes = (cartItemId, notes) => {
    setCartItems(prev => {
      return prev.map(item => {
        if ((item.cartItemId || item.id) === cartItemId) {
          return { ...item, notes };
        }
        return item;
      });
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCustomerName('');
    setDiscount(0);
  };

  // Checkout calculation
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  // Complete Payment & Save Transaction
  const handleProcessPayment = async (paymentDetails) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Generate Invoice Number: KK + 8 digits
    const prefix = settings?.invoicePrefix || 'KK';
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const invoiceNumber = `${prefix}${randomSuffix}`;

    // Nomor Antrean Harian Otomatis (#01, #02, #03...)
    const todayTxCount = transactions.filter(t => t.date === dateStr).length + 1;
    const queueNumber = `#${String(todayTxCount).padStart(2, '0')}`;

    const newTransaction = {
      invoiceNumber,
      queueNumber,
      dailyIndex: todayTxCount,
      date: dateStr,
      time: timeStr,
      customerName: customerName.trim() || (orderType === 'Dine In' ? 'Dine In' : 'Take Away'),
      orderType,
      items: [...cartItems],
      subtotal,
      discount,
      total: totalAmount,
      paymentMethod: paymentDetails.paymentMethod,
      amountPaid: paymentDetails.amountPaid,
      changeAmount: paymentDetails.changeAmount,
      status: 'Lunas',
      cashier: currentUser?.name || settings?.cashierName || 'Barista 1',
      createdAt: now.toISOString(),
    };

    // Save locally
    setTransactions(prev => [newTransaction, ...prev]);

    // Send to Google Sheets (Cloud)
    if (settings.googleScriptUrl) {
      syncTransactionToGoogleSheets(settings.googleScriptUrl, newTransaction).then(() => {
        setPendingSync(getLocalData(STORAGE_KEYS.PENDING_SYNC, []));
      });
    }

    // Set Receipt and open modal
    setCurrentReceiptTx(newTransaction);
    setIsPaymentOpen(false);
    setIsMobileCartOpen(false);
    setIsReceiptOpen(true);
  };

  // Product CRUD dengan Cloud Sync Otomatis
  const handleSaveProduct = (productData) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === productData.id);
      let updated;
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = productData;
      } else {
        updated = [productData, ...prev];
      }
      if (settings.googleScriptUrl) {
        syncMenuToGoogleSheets(settings.googleScriptUrl, updated);
      }
      return updated;
    });
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      if (settings.googleScriptUrl) {
        syncMenuToGoogleSheets(settings.googleScriptUrl, updated);
      }
      return updated;
    });
  };

  const handleToggleAvailability = (productId) => {
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          return { ...p, isAvailable: p.isAvailable === false ? true : false };
        }
        return p;
      });
      if (settings.googleScriptUrl) {
        syncMenuToGoogleSheets(settings.googleScriptUrl, updated);
      }
      return updated;
    });
  };

  // Category CRUD
  const handleSaveCategory = (categoryData) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === categoryData.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = categoryData;
        return copy;
      }
      return [...prev, categoryData];
    });
  };

  const handleDeleteCategory = (categoryId) => {
    if (categoryId === 'all') {
      showAlert('Kategori Utama', 'Kategori "Semua Menu" adalah kategori bawaan sistem dan tidak dapat dihapus.', 'warning');
      return;
    }
    const count = products.filter(p => p.categoryId === categoryId).length;
    if (count > 0) {
      showConfirm({
        title: 'Hapus Kategori',
        message: `Ada ${count} menu di kategori ini. Jika dihapus, menu tersebut akan dialihkan ke kategori lain. Lanjutkan hapus?`,
        confirmText: 'Ya, Hapus',
        type: 'danger',
        onConfirm: () => {
          const fallbackCat = categories.find(c => c.id !== 'all' && c.id !== categoryId)?.id || 'es-kopi';
          setProducts(prev => prev.map(p => p.categoryId === categoryId ? { ...p, categoryId: fallbackCat } : p));
          setCategories(prev => prev.filter(c => c.id !== categoryId));
          showToast('Kategori berhasil dihapus', 'success');
        }
      });
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    showToast('Kategori berhasil dihapus', 'success');
  };

  // Transaction Deletion
  const handleDeleteTransaction = async (invoiceNumber) => {
    setTransactions(prev => prev.filter(tx => tx.invoiceNumber !== invoiceNumber));
    if (settings.googleScriptUrl) {
      try {
        fetch(settings.googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'DELETE_TRANSACTION', invoiceNumber })
        }).catch(() => {});
      } catch (e) {}
    }
  };

  const handleBulkDeleteTransactions = async (invoiceNumbers) => {
    setTransactions(prev => prev.filter(tx => !invoiceNumbers.includes(tx.invoiceNumber)));
    if (settings.googleScriptUrl) {
      for (const inv of invoiceNumbers) {
        try {
          fetch(settings.googleScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'DELETE_TRANSACTION', invoiceNumber: inv })
          }).catch(() => {});
        } catch (e) {}
      }
    }
  };

  // Open Table (Simpan Meja / Bayar Nanti) dengan Cloud Sync
  const handleSaveOpenTable = (orderData) => {
    if (!cartItems.length) {
      showAlert('Keranjang Kosong', 'Pilih minimal satu menu sebelum menyimpan meja!', 'warning');
      return;
    }
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const tableName = customerName.trim() || `Meja ${openTables.length + 1}`;
    
    const newOpenTable = {
      id: `table-${Date.now()}`,
      tableName: tableName,
      customerName: tableName,
      tableNumber: tableName,
      orderType,
      items: [...cartItems],
      subtotal,
      discount,
      total: totalAmount,
      totalAmount: totalAmount,
      savedAtTime: timeStr,
      time: timeStr,
      savedBy: currentUser?.name || 'Kasir',
      cashier: currentUser?.name || 'Kasir',
    };

    const nextTables = [newOpenTable, ...openTables];
    setOpenTables(nextTables);
    if (settings.googleScriptUrl) {
      syncOpenTablesToGoogleSheets(settings.googleScriptUrl, nextTables);
    }

    handleClearCart();
    setIsMobileCartOpen(false);
    showToast(`Pesanan "${tableName}" berhasil disimpan ke Meja Aktif!`, 'success');
  };

  const handleLoadOpenTable = (tableOrder) => {
    setCartItems(tableOrder.items || []);
    setCustomerName(tableOrder.customerName || tableOrder.tableName || '');
    setOrderType(tableOrder.orderType || 'Dine In');
    setDiscount(tableOrder.discount || 0);
    
    // Hapus dari daftar meja aktif karena sudah dibuka kembali
    const nextTables = openTables.filter(t => t.id !== tableOrder.id);
    setOpenTables(nextTables);
    if (settings.googleScriptUrl) {
      syncOpenTablesToGoogleSheets(settings.googleScriptUrl, nextTables);
    }
    setIsOpenTablesModalOpen(false);
  };

  const handleCancelOpenTable = (tableId) => {
    const nextTables = openTables.filter(t => t.id !== tableId);
    setOpenTables(nextTables);
    if (settings.googleScriptUrl) {
      syncOpenTablesToGoogleSheets(settings.googleScriptUrl, nextTables);
    }
  };

  // User Management
  const handleSaveUser = (userData) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === userData.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = userData;
        return copy;
      }
      return [...prev, userData];
    });
  };

  const handleDeleteUser = (userId) => {
    if (userId === currentUser?.id) {
      showAlert('Akses Dibatasi', 'Anda tidak bisa menghapus akun yang sedang aktif digunakan saat ini!', 'warning');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast('Akun kasir berhasil dihapus', 'success');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
  };

  // Expense Management (Petty Cash / Kas Keluar) dengan Cloud Sync
  const handleSaveExpense = (expenseData) => {
    setExpenses(prev => [expenseData, ...prev]);
    if (settings.googleScriptUrl) {
      syncExpenseToGoogleSheets(settings.googleScriptUrl, expenseData);
    }
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // Reset demo data
  const handleResetData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setSettings(INITIAL_SETTINGS);
    setTransactions([]);
    setExpenses([]);
    setCartItems([]);
    localStorage.clear();
    showToast('Seluruh data berhasil direset kembali ke setelan awal!', 'success');
  };

  // Handle Master Kafe Login
  const handleMasterLoginSuccess = (sessionData) => {
    setMasterSession(sessionData);
    setMasterSessionState(sessionData);

    // Otomatis atur nama kafe dan link database Google Sheets dari Master
    const newSettings = {
      ...settings,
      storeName: sessionData.namaKafe || settings.storeName,
      googleScriptUrl: sessionData.linkGasKafe || settings.googleScriptUrl
    };
    setSettings(newSettings);

    // Tentukan role pengguna awal
    if (sessionData.role === 'owner') {
      const ownerUser = users.find(u => u.role === 'owner') || { id: 'u-owner', name: 'Owner', role: 'owner', avatar: '👑' };
      setCurrentUser(ownerUser);
    } else {
      const kasirUser = users.find(u => u.role === 'kasir') || { id: 'u-kasir', name: 'Kasir 1', role: 'kasir', avatar: '☕' };
      setCurrentUser(kasirUser);
    }

    showToast(`Selamat datang di ${sessionData.namaKafe}!`, 'success');

    // Langsung tarik data cloud kafe ini
    if (sessionData.linkGasKafe) {
      syncAllCloudData({ silent: true });
    }
  };

  const handleLogoutKafe = () => {
    showConfirm({
      title: 'Keluar dari Kafe?',
      message: 'Anda akan keluar dari sesi kafe ini dan kembali ke halaman login utama.',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: () => {
        clearMasterSession();
        setMasterSessionState(null);
        setIsLoginModalOpen(false);
        showToast('Berhasil keluar dari sesi kafe.', 'info');
      }
    });
  };

  // Manual sync trigger (Tombol Sinkronisasi Sekarang di Navbar)
  const handleSyncNow = async () => {
    if (!settings.googleScriptUrl) {
      showAlert('Koneksi Cloud Belum Disetel', 'Link Google Apps Script Kafe belum terkonfigurasi di Pengaturan.', 'warning');
      return;
    }
    setIsSyncing(true);

    // 1. Verifikasi lisensi & perangkat terlebih dahulu ke Master
    if (masterSession?.idKafe) {
      const deviceId = getOrCreateDeviceId();
      const verifyRes = await verifyDeviceWithMaster(masterSession.idKafe, deviceId);
      if (verifyRes && verifyRes.valid === false) {
        setIsSyncing(false);
        clearMasterSession();
        setMasterSessionState(null);
        showAlert(
          'Akses Perangkat Dicabut',
          verifyRes.message || 'Perangkat ini telah dicabut atau direset dari Master Lisensi Kafe di spreadsheet.',
          'error'
        );
        return;
      }
    }

    // 2. Jalankan sinkronisasi data cloud
    await syncAllCloudData({ silent: false });
    setIsSyncing(false);
  };

  // Jika belum login ke Master Kafe, tampilkan MasterLoginPage di depan
  if (!masterSession) {
    return <MasterLoginPage onLoginSuccess={handleMasterLoginSuccess} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 dark:bg-[#171412] font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.reduce((sum, item) => sum + item.qty, 0)}
        onOpenMobileCart={() => setIsMobileCartOpen(true)}
        storeName={settings.storeName}
        isCloudConnected={Boolean(settings.googleScriptUrl)}
        pendingSyncCount={pendingSync.length}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
        currentUser={currentUser}
        onOpenSwitchUser={() => setIsLoginModalOpen(true)}
        openTablesCount={openTables.length}
        onOpenTableList={() => setIsOpenTablesModalOpen(true)}
      />

      {/* Main View Area (Beri padding bottom di mobile agar tidak tertutup BottomNav) */}
      <div className="flex-1 flex overflow-hidden relative pb-14 md:pb-0">
        {activeTab === 'pos' && (
          <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            {/* POS Catalog */}
            <PosTerminal
              products={products}
              categories={categories}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
              onToggleAvailability={handleToggleAvailability}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            />

            {/* Desktop Cart Sidebar */}
            <div className="hidden lg:block h-full">
              <CartSidebar
                cartItems={cartItems}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
                onUpdateNotes={handleUpdateNotes}
                onClearCart={handleClearCart}
                orderType={orderType}
                setOrderType={setOrderType}
                customerName={customerName}
                setCustomerName={setCustomerName}
                discount={discount}
                setDiscount={setDiscount}
                onOpenPayment={() => setIsPaymentOpen(true)}
                onSaveOpenTable={handleSaveOpenTable}
                onOpenTableList={() => setIsOpenTablesModalOpen(true)}
                openTablesCount={openTables.length}
              />
            </div>

            {/* Mobile Floating Round Cart Button */}
            {cartItems.length > 0 && !isMobileCartOpen && (
              <button
                onClick={() => setIsMobileCartOpen(true)}
                className="lg:hidden fixed bottom-20 right-4 sm:right-6 w-14 h-14 bg-[#5c3a21] text-white rounded-full shadow-2xl flex items-center justify-center z-30 active:scale-95 transition-all hover:bg-[#4a2e1a] cursor-pointer"
                aria-label="Keranjang"
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#b05d49] text-white rounded-full text-xs font-bold flex items-center justify-center shadow-sm">
                  {cartItems.reduce((s, i) => s + i.qty, 0)}
                </span>
              </button>
            )}

            {/* Mobile Drawer Cart */}
            {isMobileCartOpen && (
              <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end">
                <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
                  <CartSidebar
                    cartItems={cartItems}
                    onUpdateQty={handleUpdateQty}
                    onRemoveItem={handleRemoveItem}
                    onUpdateNotes={handleUpdateNotes}
                    onClearCart={handleClearCart}
                    orderType={orderType}
                    setOrderType={setOrderType}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    discount={discount}
                    setDiscount={setDiscount}
                    onOpenPayment={() => {
                      setIsMobileCartOpen(false);
                      setIsPaymentOpen(true);
                    }}
                    onSaveOpenTable={handleSaveOpenTable}
                    onOpenTableList={() => {
                      setIsMobileCartOpen(false);
                      setIsOpenTablesModalOpen(true);
                    }}
                    openTablesCount={openTables.length}
                    isMobileDrawer={true}
                    onCloseMobileDrawer={() => setIsMobileCartOpen(false)}
                  />
                </div>
              </div>
            )}
          </main>
        )}

        {/* Tab Kelola Menu */}
        {activeTab === 'menu' && (
          <MenuManager
            products={products}
            categories={categories}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleAvailability={handleToggleAvailability}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {/* Tab Laporan & Riwayat */}
        {activeTab === 'reports' && (
          <ReportsHistory
            transactions={transactions}
            onReprintReceipt={(tx) => {
              setCurrentReceiptTx(tx);
              setIsReceiptOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onBulkDeleteTransactions={handleBulkDeleteTransactions}
            settings={settings}
            currentUser={currentUser}
            expenses={expenses}
            onDeleteExpense={handleDeleteExpense}
            onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
          />
        )}

        {/* Tab Pengaturan */}
        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onSaveSettings={(newSettings) => setSettings(newSettings)}
            onResetData={handleResetData}
            currentUser={currentUser}
            users={users}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

      {/* Modal Pembayaran (Tunai & QRIS) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={totalAmount}
        onProcessPayment={handleProcessPayment}
        settings={settings}
      />

      {/* Modal Cetak Struk Thermal */}
      <ReceiptThermal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={currentReceiptTx}
        settings={settings}
        onNewOrder={() => {
          handleClearCart();
          setActiveTab('pos');
        }}
      />

      {/* Modal Meja Aktif (Open Table / Bayar Nanti) */}
      <OpenTablesModal
        isOpen={isOpenTablesModalOpen}
        onClose={() => setIsOpenTablesModalOpen(false)}
        openTables={openTables}
        onLoadTable={handleLoadOpenTable}
        onCancelTable={handleCancelOpenTable}
      />

      {/* Modal Ganti Akun / Login Kasir, Admin, Owner */}
      <LoginModal
        isOpen={isLoginModalOpen}
        canClose={true}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        storeName={settings.storeName}
        onLogoutKafe={handleLogoutKafe}
      />

      {/* Modal Catat Kas Keluar (Petty Cash) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaveExpense={handleSaveExpense}
        currentUser={currentUser}
      />
    </div>
  );
}
