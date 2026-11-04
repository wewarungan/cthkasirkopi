import React, { useState, useMemo } from 'react';
import { 
  Wallet, ShoppingCart, TrendingUp, Calendar, 
  Printer, Search, DollarSign, PieChart, ShieldAlert,
  Trash2, CheckSquare, Square, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function ReportsHistory({
  transactions,
  onReprintReceipt,
  onDeleteTransaction,
  onBulkDeleteTransactions,
  settings,
  currentUser,
  expenses = [],
  onDeleteExpense,
  onOpenExpenseModal,
}) {
  const { showToast, showConfirm } = useNotification();
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';
  const isKasir = currentUser?.role === 'kasir';

  // Selection & Notification State
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  // Period filter: 'today', 'month', 'year', 'all'
  const [period, setPeriod] = useState('today');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination States
  const [txPage, setTxPage] = useState(1);
  const [txPerPage, setTxPerPage] = useState(10); // 10, 25, 50, 100

  const [expPage, setExpPage] = useState(1);
  const [expPerPage, setExpPerPage] = useState(5); // 5, 10, 25

  const [topProductLimit, setTopProductLimit] = useState(5); // 5, 10, 'all'

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatShortRupiah = (val) => {
    if (!val) return '0';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `${Math.round(val / 1000)}rb`;
    return val.toString();
  };

  // Filter Transactions based on period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (!tx.date) return false;

      // Kasir only sees today's shift
      let matchPeriod = true;
      if (isKasir || period === 'today') {
        matchPeriod = tx.date === todayStr;
      } else if (period === 'month') {
        matchPeriod = tx.date.startsWith(selectedMonth);
      } else if (period === 'year') {
        matchPeriod = tx.date.startsWith(selectedYear);
      }

      const matchSearch = searchQuery === '' || 
        tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.cashier && tx.cashier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.items?.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchPeriod && matchSearch;
    });
  }, [transactions, period, selectedMonth, selectedYear, searchQuery, todayStr, isKasir]);

  // Filter Expenses based on period
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (!exp.date) return false;
      if (isKasir || period === 'today') {
        return exp.date === todayStr;
      } else if (period === 'month') {
        return exp.date.startsWith(selectedMonth);
      } else if (period === 'year') {
        return exp.date.startsWith(selectedYear);
      }
      return true;
    });
  }, [expenses, period, selectedMonth, selectedYear, todayStr, isKasir]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const totalCashSales = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.paymentMethod === 'Tunai')
      .reduce((sum, tx) => sum + (tx.total || 0), 0);
  }, [filteredTransactions]);

  const totalQrisSales = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.paymentMethod === 'QRIS')
      .reduce((sum, tx) => sum + (tx.total || 0), 0);
  }, [filteredTransactions]);

  const netCashInDrawer = totalCashSales - totalExpense;

  // Calculations for Summary Cards
  const totalOmzet = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0);
  }, [filteredTransactions]);

  const totalCount = filteredTransactions.length;
  const avgPerTx = totalCount > 0 ? Math.round(totalOmzet / totalCount) : 0;

  // Total HPP / Modal Bahan Terjual & Laba Kotor (Khusus Owner)
  const financialProfit = useMemo(() => {
    let totalCost = 0;
    filteredTransactions.forEach(tx => {
      tx.items?.forEach(item => {
        // Fallback costPrice if not explicitly stored: 40% of item price
        const unitCost = typeof item.costPrice === 'number' ? item.costPrice : Math.round(item.price * 0.4);
        totalCost += unitCost * (item.qty || 1);
      });
    });

    const profit = Math.max(0, totalOmzet - totalCost);
    const margin = totalOmzet > 0 ? Math.round((profit / totalOmzet) * 100) : 0;

    return { totalCost, profit, margin };
  }, [filteredTransactions, totalOmzet]);

  // 1. Hourly Sales Data
  const hourlyData = useMemo(() => {
    const hours = [8, 10, 12, 14, 16, 18, 20, 22];
    const data = hours.map(h => ({ hour: h, label: `${h}`, total: 0 }));

    filteredTransactions.forEach(tx => {
      if (tx.time) {
        const hourNum = parseInt(tx.time.split(':')[0], 10);
        let closest = hours[0];
        for (const h of hours) {
          if (Math.abs(hourNum - h) <= 1) {
            closest = h;
            break;
          }
        }
        const bin = data.find(d => d.hour === closest);
        if (bin) bin.total += (tx.total || 0);
      }
    });

    const maxVal = Math.max(...data.map(d => d.total), 1);
    return { data, maxVal };
  }, [filteredTransactions]);

  // 2. Sales by Category
  const categoryData = useMemo(() => {
    const catMap = {
      'Kopi': { name: 'Kopi', total: 0, color: '#5c3a21' },
      'Non-Kopi': { name: 'Non-Kopi', total: 0, color: '#2d6a4f' },
      'Makanan': { name: 'Makanan', total: 0, color: '#d4a373' },
      'Lain': { name: 'Lain', total: 0, color: '#8d99ae' },
    };

    filteredTransactions.forEach(tx => {
      tx.items?.forEach(item => {
        const lower = (item.name || '').toLowerCase();
        const itemTotal = (item.price || 0) * (item.qty || 1);

        if (lower.includes('kopi') || lower.includes('espresso') || lower.includes('latte') || lower.includes('americano') || lower.includes('cappuccino') || lower.includes('macchiato')) {
          catMap['Kopi'].total += itemTotal;
        } else if (lower.includes('tea') || lower.includes('matcha') || lower.includes('chocolate') || lower.includes('susu') || lower.includes('taro')) {
          catMap['Non-Kopi'].total += itemTotal;
        } else if (lower.includes('croissant') || lower.includes('goreng') || lower.includes('roti') || lower.includes('kentang') || lower.includes('pisang')) {
          catMap['Makanan'].total += itemTotal;
        } else {
          catMap['Lain'].total += itemTotal;
        }
      });
    });

    const categoriesArray = Object.values(catMap);
    const sumAll = categoriesArray.reduce((s, c) => s + c.total, 0) || 1;

    return categoriesArray.map(c => ({
      ...c,
      percentage: totalOmzet > 0 ? Math.round((c.total / sumAll) * 100) : 0,
    }));
  }, [filteredTransactions, totalOmzet]);

  // 3. Best Selling Products & Profit Analysis
  const topProducts = useMemo(() => {
    const prodMap = {};
    filteredTransactions.forEach(tx => {
      tx.items?.forEach(item => {
        if (!prodMap[item.name]) {
          const unitCost = typeof item.costPrice === 'number' ? item.costPrice : Math.round(item.price * 0.4);
          prodMap[item.name] = { 
            name: item.name, 
            qty: 0, 
            price: item.price,
            cost: unitCost,
            totalRevenue: 0,
            totalProfit: 0,
          };
        }
        const qty = item.qty || 1;
        prodMap[item.name].qty += qty;
        prodMap[item.name].totalRevenue += item.price * qty;
        prodMap[item.name].totalProfit += (item.price - prodMap[item.name].cost) * qty;
      });
    });

    return Object.values(prodMap)
      .sort((a, b) => b.qty - a.qty);
  }, [filteredTransactions]);

  // Transactions pagination calculation
  const totalTxPages = Math.max(1, Math.ceil(filteredTransactions.length / txPerPage));
  const safeTxPage = Math.min(Math.max(1, txPage), totalTxPages);
  const txStartIndex = filteredTransactions.length > 0 ? (safeTxPage - 1) * txPerPage : 0;
  const txEndIndex = Math.min(txStartIndex + txPerPage, filteredTransactions.length);
  const paginatedTransactions = filteredTransactions.slice(txStartIndex, txEndIndex);

  // Expenses pagination calculation
  const totalExpPages = Math.max(1, Math.ceil(filteredExpenses.length / expPerPage));
  const safeExpPage = Math.min(Math.max(1, expPage), totalExpPages);
  const expStartIndex = filteredExpenses.length > 0 ? (safeExpPage - 1) * expPerPage : 0;
  const expEndIndex = Math.min(expStartIndex + expPerPage, filteredExpenses.length);
  const paginatedExpenses = filteredExpenses.slice(expStartIndex, expEndIndex);

  // Top products display list
  const displayedTopProducts = topProductLimit === 'all' 
    ? topProducts 
    : topProducts.slice(0, Number(topProductLimit));

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setTxPage(1);
    setExpPage(1);
  };

  const getPeriodLabel = () => {
    if (isKasir) return 'Shift Hari Ini';
    if (period === 'today') return 'Hari ini';
    if (period === 'month') return `Bulan ${selectedMonth}`;
    if (period === 'year') return `Tahun ${selectedYear}`;
    return 'Semua Waktu';
  };

  return (
    <div className="flex-1 bg-[#f8f5f0] overflow-y-auto p-3.5 sm:p-6 space-y-4 max-w-4xl mx-auto w-full font-sans text-stone-800">
      
      {/* Title & Filter Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            {isKasir ? 'Riwayat Transaksi Kasir' : 'Laporan Penjualan & Finansial'}
          </h2>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#d8b89d]/40 text-[#5c3a21] border border-[#d8b89d]/60">
            {getPeriodLabel()}
          </span>
        </div>

        {/* Period Selector Tabs (Hidden for Kasir to protect historical data) */}
        {!isKasir && (
          <div className="flex items-center gap-1.5 bg-[#ede7de] p-1 rounded-2xl overflow-x-auto text-xs">
            <button
              onClick={() => handlePeriodChange('today')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                period === 'today' ? 'bg-[#5c3a21] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                period === 'month' ? 'bg-[#5c3a21] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Per Bulan
            </button>
            <button
              onClick={() => handlePeriodChange('year')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                period === 'year' ? 'bg-[#5c3a21] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Per Tahun
            </button>
            <button
              onClick={() => handlePeriodChange('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                period === 'all' ? 'bg-[#5c3a21] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua
            </button>
          </div>
        )}
      </div>

      {/* Sub-selectors if Month or Year is chosen */}
      {!isKasir && period === 'month' && (
        <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs">
          <Calendar className="w-4 h-4 text-[#5c3a21]" />
          <span className="text-xs font-semibold text-stone-600">Pilih Bulan:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setTxPage(1);
              setExpPage(1);
            }}
            className="px-2.5 py-1 text-xs bg-[#f8f5f0] border border-stone-200 rounded-xl focus:outline-none font-bold text-stone-800"
          />
        </div>
      )}

      {!isKasir && period === 'year' && (
        <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs">
          <Calendar className="w-4 h-4 text-[#5c3a21]" />
          <span className="text-xs font-semibold text-stone-600">Pilih Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setTxPage(1);
              setExpPage(1);
            }}
            className="px-2.5 py-1 text-xs bg-[#f8f5f0] border border-stone-200 rounded-xl focus:outline-none font-bold text-stone-800"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4 TOP SUMMARY CARDS (HANYA DITAMPILKAN KE OWNER & ADMIN) */}
      {/* ========================================================= */}
      {!isKasir && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Omzet */}
          <div className="bg-white rounded-3xl p-4 border-l-4 border-l-[#5c3a21] shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-stone-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <div className="p-1.5 rounded-lg bg-[#f2eae0] text-[#7d5635]">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span>OMZET PENJUALAN</span>
            </div>
            <div className="mt-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 truncate">
                {formatRupiah(totalOmzet)}
              </h3>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Tunai: {formatShortRupiah(totalCashSales)} • QRIS: {formatShortRupiah(totalQrisSales)}
              </p>
            </div>
          </div>

          {/* Card 2: Jumlah Transaksi */}
          <div className="bg-white rounded-3xl p-4 border-l-4 border-l-[#a67c52] shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-stone-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <div className="p-1.5 rounded-lg bg-[#f2eae0] text-[#7d5635]">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <span>TOTAL TRANSAKSI</span>
            </div>
            <div className="mt-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900">
                {totalCount}
              </h3>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Rata-rata: {formatRupiah(avgPerTx)}
              </p>
            </div>
          </div>

          {/* Card 3: Kas Keluar (Petty Cash) */}
          <div className="bg-white rounded-3xl p-4 border-l-4 border-l-rose-500 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span>KAS KELUAR</span>
              </div>
              {onOpenExpenseModal && (
                <button
                  type="button"
                  onClick={onOpenExpenseModal}
                  className="text-[10px] font-bold text-rose-700 hover:underline"
                >
                  + Catat
                </button>
              )}
            </div>
            <div className="mt-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-rose-600 truncate">
                {formatRupiah(totalExpense)}
              </h3>
              <p className="text-[10px] text-stone-400 mt-0.5">
                {filteredExpenses.length} pengeluaran kas kecil
              </p>
            </div>
          </div>

          {/* Card 4: Sisa Kas di Laci (Uang Fisik Kasir) */}
          <div className="bg-white rounded-3xl p-4 border-l-4 border-l-emerald-600 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-stone-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <span>SISA KAS LACI</span>
            </div>
            <div className="mt-2">
              <h3 className={`text-lg sm:text-xl font-extrabold truncate ${netCashInDrawer < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatRupiah(netCashInDrawer)}
              </h3>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Uang tunai wajib ada di laci
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KHUSUS OWNER: ANALISIS LABA BERSIH & MARGIN HPP */}
      {/* ========================================================= */}
      {isOwner && (
        <div className="bg-gradient-to-br from-[#fbf8f4] to-[#f4ebe0] rounded-3xl p-4 sm:p-6 border border-[#dfcbb7] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#5c3a21] text-amber-200 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900">Analisis Laba Bersih & Margin HPP</h3>
                <p className="text-xs text-stone-600">Rahasia Keuangan Kedai • Khusus Akun Owner</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
              Margin {financialProfit.margin}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[#ecdccb]">
              <span className="text-[11px] font-semibold text-stone-500">Total Omset Penjualan</span>
              <p className="text-base sm:text-lg font-extrabold text-stone-900 mt-1">{formatRupiah(totalOmzet)}</p>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[#ecdccb]">
              <span className="text-[11px] font-semibold text-stone-500">Total Modal Bahan (HPP)</span>
              <p className="text-base sm:text-lg font-extrabold text-rose-700 mt-1">{formatRupiah(financialProfit.totalCost)}</p>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[#ecdccb]">
              <span className="text-[11px] font-semibold text-stone-500">Laba Kotor (Gross Profit)</span>
              <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1">{formatRupiah(financialProfit.profit)}</p>
            </div>
          </div>

          {/* Rincian Keuntungan per Menu Kopi */}
          <div className="pt-2">
            <h4 className="font-bold text-xs text-stone-800 mb-2">Rincian Keuntungan per Menu Kopi:</h4>
            <div className="divide-y divide-[#ecdccb] bg-white/70 rounded-2xl border border-[#ecdccb] overflow-hidden text-xs">
              {topProducts.slice(0, 5).map((item, idx) => {
                const profitPerItem = item.price - item.cost;
                const marginPercent = item.price > 0 ? Math.round((profitPerItem / item.price) * 100) : 0;
                return (
                  <div key={idx} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-stone-900">{item.name}</span>
                      <p className="text-[11px] text-stone-500">
                        Jual: {formatRupiah(item.price)} • Modal: {formatRupiah(item.cost)} • <span className="text-emerald-700 font-bold">Untung: {formatRupiah(profitPerItem)}/item</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-700">{formatRupiah(item.totalProfit)}</span>
                      <p className="text-[10px] text-stone-500">{item.qty} terjual ({marginPercent}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 1: GRAFIK PENJUALAN PER JAM (HANYA OWNER / ADMIN) */}
      {/* ========================================================= */}
      {!isKasir && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#7d5635] rounded-full"></span>
            <h3 className="font-bold text-stone-900 text-sm">Penjualan per Jam</h3>
          </div>

          <div className="h-44 sm:h-52 w-full pt-4 pb-2 relative flex flex-col justify-end">
            <div className="absolute inset-x-0 top-3 flex flex-col justify-between h-32 sm:h-38 pointer-events-none">
              {[24, 18, 12, 6, 0].map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 w-full">
                  <span className="text-[10px] text-stone-400 w-6 text-right">{step}rb</span>
                  <div className="flex-1 border-b border-dashed border-stone-200"></div>
                </div>
              ))}
            </div>

            <div className="relative pl-8 pr-2 h-32 sm:h-38 flex items-end justify-between gap-1 sm:gap-4 z-10">
              {hourlyData.data.map((item, idx) => {
                const maxRef = Math.max(hourlyData.maxVal, 24000);
                const heightPercent = item.total > 0 ? Math.min(100, Math.max(12, (item.total / maxRef) * 100)) : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                    {item.total > 0 && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-[#5c3a21] mb-1 whitespace-nowrap bg-amber-50 px-1 rounded shadow-2xs">
                        {formatShortRupiah(item.total)}
                      </span>
                    )}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                        item.total > 0 ? 'bg-gradient-to-t from-[#5c3a21] to-[#a67c52] shadow-xs' : 'bg-transparent'
                      }`}
                    ></div>
                  </div>
                );
              })}
            </div>

            <div className="pl-8 pr-2 flex justify-between pt-2 border-t border-stone-200 text-[10px] text-stone-500 font-medium">
              {hourlyData.data.map((item, idx) => (
                <span key={idx} className="w-6 text-center">{item.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: PENJUALAN PER KATEGORI (HANYA OWNER / ADMIN) */}
      {/* ========================================================= */}
      {!isKasir && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#7d5635] rounded-full"></span>
            <h3 className="font-bold text-stone-900 text-sm">Penjualan per Kategori</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#eee8df" strokeWidth="16" />
                {(() => {
                  let accumulatedPercent = 0;
                  return categoryData.map((cat, idx) => {
                    if (cat.percentage <= 0) return null;
                    const strokeDasharray = `${cat.percentage * 2.387} 238.7`;
                    const strokeDashoffset = `-${accumulatedPercent * 2.387}`;
                    accumulatedPercent += cat.percentage;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-700 ease-out"
                      />
                    );
                  });
                })()}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs text-stone-500 font-medium">Total</span>
                <span className="text-lg sm:text-xl font-extrabold text-stone-900">
                  {formatShortRupiah(totalOmzet)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: cat.color }}></span>
                  <span className="font-semibold text-stone-800">{cat.name}</span>
                </div>
                <div className="text-stone-500 font-medium">
                  <span>{cat.percentage}% · </span>
                  <span className="text-stone-700 font-bold">{formatRupiah(cat.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: PRODUK TERLARIS */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#7d5635] rounded-full"></span>
            <h3 className="font-bold text-stone-900 text-sm">Produk Terlaris</h3>
            <span className="text-xs text-stone-400">({topProducts.length})</span>
          </div>

          {topProducts.length > 5 && (
            <div className="flex items-center gap-1 bg-[#ede7de] p-1 rounded-xl text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTopProductLimit(5)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  topProductLimit === 5 ? 'bg-[#5c3a21] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Top 5
              </button>
              <button
                type="button"
                onClick={() => setTopProductLimit(10)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  topProductLimit === 10 ? 'bg-[#5c3a21] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => setTopProductLimit('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  topProductLimit === 'all' ? 'bg-[#5c3a21] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Semua ({topProducts.length})
              </button>
            </div>
          )}
        </div>

        {displayedTopProducts.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-400">
            Belum ada produk terjual pada periode ini.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTopProducts.map((prod, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#fcfaf7] border border-stone-200/60"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-stone-400 text-white' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-stone-200 text-stone-700'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-stone-800">
                    {prod.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-stone-600">
                    {prod.qty} terjual
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: RIWAYAT TRANSAKSI SHIFT / PERIODE */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-3.5">
        
        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <button 
              onClick={() => setToastMessage('')}
              className="text-stone-400 hover:text-stone-700 text-xs"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#7d5635] rounded-full"></span>
            <h3 className="font-bold text-stone-900 text-sm">
              {isKasir ? 'Daftar Transaksi Shift Anda' : 'Riwayat Transaksi'}
            </h3>
            <span className="text-xs text-stone-400">({filteredTransactions.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari invoice, kasir..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setTxPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-[#f8f5f0] border border-stone-200 rounded-xl text-xs w-full sm:w-48 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Select All Button */}
            {filteredTransactions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedInvoices.length === filteredTransactions.length) {
                    setSelectedInvoices([]);
                  } else {
                    setSelectedInvoices(filteredTransactions.map(tx => tx.invoiceNumber));
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-[#f8f5f0] hover:bg-[#ede7df] text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                title="Pilih / Batalkan Semua"
              >
                {selectedInvoices.length === filteredTransactions.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#5c3a21]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-stone-400" />
                )}
                <span className="hidden sm:inline">Pilih Semua</span>
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Bar (Muncul jika ada transaksi yang dicentang) */}
        {selectedInvoices.length > 0 && (
          <div className="p-3 bg-[#fdf5f3] border border-rose-200 rounded-2xl flex items-center justify-between gap-2 text-xs animate-in fade-in">
            <span className="font-bold text-rose-900">
              {selectedInvoices.length} transaksi dicentang
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoices([])}
                className="px-2.5 py-1 rounded-xl text-stone-600 hover:text-stone-900 font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  showConfirm({
                    title: 'Hapus Transaksi Terpilih',
                    message: `Yakin ingin menghapus ${selectedInvoices.length} transaksi yang dicentang? Data omset dan jumlah transaksi akan otomatis diperbarui.`,
                    confirmText: `Ya, Hapus (${selectedInvoices.length})`,
                    type: 'danger',
                    onConfirm: () => {
                      const count = selectedInvoices.length;
                      onBulkDeleteTransactions(selectedInvoices);
                      setSelectedInvoices([]);
                      showToast(`${count} transaksi berhasil dihapus!`, 'success');
                    }
                  });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih ({selectedInvoices.length})</span>
              </button>
            </div>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-400">
            Tidak ada transaksi pada periode ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedTransactions.map((tx) => {
              const isChecked = selectedInvoices.includes(tx.invoiceNumber);
              const totalItemsCount = tx.items?.reduce((s, i) => s + (i.qty || 1), 0) || 0;
              const formattedTime = tx.time ? tx.time.slice(0, 5) : '00:00';

              return (
                <div
                  key={tx.invoiceNumber}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                    isChecked
                      ? 'bg-[#fbf7f4] border-[#b58e6d] shadow-2xs'
                      : 'bg-[#fcfaf7] border-stone-200/80 hover:border-[#b58e6d]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox Centang */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoices(prev => 
                          prev.includes(tx.invoiceNumber) 
                            ? prev.filter(inv => inv !== tx.invoiceNumber) 
                            : [...prev, tx.invoiceNumber]
                        );
                      }}
                      className="p-1 text-stone-500 hover:text-[#5c3a21] transition-colors"
                      title={isChecked ? "Batal Centang" : "Centang Transaksi Ini"}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#5c3a21]" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>

                    {/* Transaction Details */}
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                        <span>{tx.invoiceNumber}</span>
                        {isChecked && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            Dipilih
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {formattedTime} · {totalItemsCount} item · <span className="font-semibold text-stone-700">{tx.paymentMethod}</span>
                        {tx.cashier && <span> · Kasir: <strong className="text-stone-700">{tx.cashier}</strong></span>}
                      </p>
                      <p className="text-[11px] text-stone-600 line-clamp-1 max-w-sm">
                        {tx.items?.map(i => `${i.name} (x${i.qty})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Amount + Print + Delete */}
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#7d5635] text-sm sm:text-base">
                      {formatRupiah(tx.total)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onReprintReceipt(tx)}
                      title="Cetak Ulang Struk"
                      className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        showConfirm({
                          title: 'Hapus Transaksi',
                          message: `Yakin ingin menghapus transaksi invoice ${tx.invoiceNumber} (${formatRupiah(tx.total)})? Data omset akan diperbarui.`,
                          confirmText: 'Ya, Hapus',
                          type: 'danger',
                          onConfirm: () => {
                            onDeleteTransaction(tx.invoiceNumber);
                            setSelectedInvoices(prev => prev.filter(inv => inv !== tx.invoiceNumber));
                            showToast(`Transaksi ${tx.invoiceNumber} berhasil dihapus!`, 'success');
                          }
                        });
                      }}
                      title="Hapus Transaksi Ini"
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 shadow-2xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar for Transactions */}
        {filteredTransactions.length > 0 && (
          <div className="pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-500">
              <span>Tampilkan:</span>
              <select
                value={txPerPage}
                onChange={(e) => {
                  setTxPerPage(Number(e.target.value));
                  setTxPage(1);
                }}
                className="px-2 py-1 bg-[#f8f5f0] border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per hal</span>
              <span className="text-stone-300">|</span>
              <span className="font-medium text-stone-600">
                {txStartIndex + 1} - {txEndIndex} dari {filteredTransactions.length} transaksi
              </span>
            </div>

            {totalTxPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeTxPage <= 1}
                  onClick={() => setTxPage(1)}
                  title="Halaman Pertama"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeTxPage <= 1}
                  onClick={() => setTxPage(p => Math.max(1, p - 1))}
                  title="Halaman Sebelumnya"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 font-bold text-stone-700 bg-stone-100 rounded-lg text-xs">
                  Hal {safeTxPage} / {totalTxPages}
                </span>

                <button
                  type="button"
                  disabled={safeTxPage >= totalTxPages}
                  onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                  title="Halaman Selanjutnya"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeTxPage >= totalTxPages}
                  onClick={() => setTxPage(totalTxPages)}
                  title="Halaman Terakhir"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 5: RIWAYAT KAS KELUAR (PETTY CASH) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                Riwayat Kas Keluar Toko (Petty Cash)
              </h3>
              <p className="text-[11px] text-stone-500">
                Total pengeluaran kas kecil periode ini: <strong className="text-rose-600">{formatRupiah(totalExpense)}</strong>
              </p>
            </div>
          </div>

          {onOpenExpenseModal && (
            <button
              type="button"
              onClick={onOpenExpenseModal}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>+ Catat Kas Keluar</span>
            </button>
          )}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-xs">
            Tidak ada catatan kas keluar pada periode ini.
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#fcfaf7] border border-stone-200/80 hover:border-rose-200 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm">
                      {exp.note}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                      {exp.category || 'Operasional'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {exp.date} {exp.time} · Dicatat oleh: <strong>{exp.recordedBy || 'Kasir'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-rose-600 text-xs sm:text-sm">
                    - {formatRupiah(exp.amount)}
                  </span>
                  {onDeleteExpense && (
                    <button
                      type="button"
                      onClick={() => {
                        showConfirm({
                          title: 'Hapus Catatan Kas Keluar',
                          message: `Yakin ingin menghapus catatan pengeluaran "${exp.note}" sebesar ${formatRupiah(exp.amount)}? Saldo laci akan bertambah kembali.`,
                          confirmText: 'Ya, Hapus',
                          type: 'danger',
                          onConfirm: () => {
                            onDeleteExpense(exp.id);
                            showToast('Catatan kas keluar berhasil dihapus', 'info');
                          }
                        });
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Hapus Pengeluaran Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar for Expenses */}
        {filteredExpenses.length > 0 && (
          <div className="pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-500">
              <span>Tampilkan:</span>
              <select
                value={expPerPage}
                onChange={(e) => {
                  setExpPerPage(Number(e.target.value));
                  setExpPage(1);
                }}
                className="px-2 py-1 bg-[#f8f5f0] border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>per hal</span>
              <span className="text-stone-300">|</span>
              <span className="font-medium text-stone-600">
                {expStartIndex + 1} - {expEndIndex} dari {filteredExpenses.length} catatan
              </span>
            </div>

            {totalExpPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeExpPage <= 1}
                  onClick={() => setExpPage(1)}
                  title="Halaman Pertama"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeExpPage <= 1}
                  onClick={() => setExpPage(p => Math.max(1, p - 1))}
                  title="Halaman Sebelumnya"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 font-bold text-stone-700 bg-stone-100 rounded-lg text-xs">
                  Hal {safeExpPage} / {totalExpPages}
                </span>

                <button
                  type="button"
                  disabled={safeExpPage >= totalExpPages}
                  onClick={() => setExpPage(p => Math.min(totalExpPages, p + 1))}
                  title="Halaman Selanjutnya"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeExpPage >= totalExpPages}
                  onClick={() => setExpPage(totalExpPages)}
                  title="Halaman Terakhir"
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-colors"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
