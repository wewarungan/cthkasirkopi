import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import Navbar from './components/Navbar';
import PosTerminal from './components/PosTerminal';
import CartSidebar from './components/CartSidebar';
import PaymentModal from './components/PaymentModal';
import ReceiptThermal from './components/ReceiptThermal';
import MenuManager from './components/MenuManager';
import ReportsHistory from './components/ReportsHistory';
import SettingsModal from './components/SettingsModal';
import OpenTablesModal from './components/OpenTablesModal';
import LoginModal from './components/LoginModal';
import { useNotification } from './context/NotificationContext';

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
  processPendingSync
} from './services/googleSheets';

export default function App() {
  const { showToast, showAlert, showConfirm } = useNotification();

  // Navigation State
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'reports', 'menu', 'settings'

  // Persistent States
  const [products, setProducts] = useState(() => getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [categories, setCategories] = useState(() => getLocalData(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
  const [transactions, setTransactions] = useState(() => getLocalData(STORAGE_KEYS.TRANSACTIONS, []));
  const [settings, setSettings] = useState(() => getLocalData(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
  const [users, setUsers] = useState(() => getLocalData(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState(() => getLocalData(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]));
  const [openTables, setOpenTables] = useState(() => getLocalData(STORAGE_KEYS.OPEN_TABLES, []));

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
    setLocalData(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    setLocalData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Periodic offline sync processor
  useEffect(() => {
    if (settings.googleScriptUrl) {
      processPendingSync(settings.googleScriptUrl).then(() => {
        setPendingSync(getLocalData(STORAGE_KEYS.PENDING_SYNC, []));
      });
    }
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
    
    // Generate Invoice Number: KK + 8 digits (matching KK85762642 from reference)
    const prefix = settings?.invoicePrefix || 'KK';
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const invoiceNumber = `${prefix}${randomSuffix}`;

    const newTransaction = {
      invoiceNumber,
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

  // Product CRUD
  const handleSaveProduct = (productData) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === productData.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = productData;
        return copy;
      }
      return [productData, ...prev];
    });
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleToggleAvailability = (productId) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, isAvailable: p.isAvailable === false ? true : false };
      }
      return p;
    }));
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

  // Open Table (Simpan Meja / Bayar Nanti)
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
      customerName: tableName,
      tableNumber: tableName,
      orderType,
      items: [...cartItems],
      subtotal,
      discount,
      total: totalAmount,
      savedAtTime: timeStr,
      time: timeStr,
      savedBy: currentUser?.name || 'Kasir',
    };

    setOpenTables(prev => [newOpenTable, ...prev]);
    handleClearCart();
    setIsMobileCartOpen(false);
    showToast(`Pesanan "${tableName}" berhasil disimpan ke Meja Aktif!`, 'success');
  };

  const handleLoadOpenTable = (tableOrder) => {
    setCartItems(tableOrder.items || []);
    setCustomerName(tableOrder.customerName || '');
    setOrderType(tableOrder.orderType || 'Dine In');
    setDiscount(tableOrder.discount || 0);
    // Hapus dari daftar meja aktif karena sudah dibuka kembali
    setOpenTables(prev => prev.filter(t => t.id !== tableOrder.id));
    setIsOpenTablesModalOpen(false);
  };

  const handleCancelOpenTable = (tableId) => {
    setOpenTables(prev => prev.filter(t => t.id !== tableId));
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

  // Reset demo data
  const handleResetData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setSettings(INITIAL_SETTINGS);
    setTransactions([]);
    setCartItems([]);
    localStorage.clear();
    showToast('Seluruh data berhasil direset kembali ke setelan awal!', 'success');
  };

  // Manual sync trigger
  const handleSyncNow = async () => {
    if (!settings.googleScriptUrl) return;
    setIsSyncing(true);
    await processPendingSync(settings.googleScriptUrl);
    setPendingSync(getLocalData(STORAGE_KEYS.PENDING_SYNC, []));
    setIsSyncing(false);
  };

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

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'pos' && (
          <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            {/* POS Catalog */}
            <PosTerminal
              products={products}
              categories={categories}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
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

            {/* Mobile Floating Round Cart Button (Sesuai Foto 5) */}
            {cartItems.length > 0 && !isMobileCartOpen && (
              <button
                onClick={() => setIsMobileCartOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#5c3a21] text-white rounded-full shadow-2xl flex items-center justify-center z-30 active:scale-95 transition-all hover:bg-[#4a2e1a]"
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
      />
    </div>
  );
}
