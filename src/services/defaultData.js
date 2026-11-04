// Helper to transform Google Drive sharing links to direct embeddable image URLs
export function formatDriveImageUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  
  // Already direct or data url or http image
  if (trimmed.startsWith('data:image') || trimmed.includes('lh3.googleusercontent.com') || trimmed.includes('images.unsplash.com')) {
    return trimmed;
  }

  // Google Drive standard link extraction
  // Patterns: 
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  const matchId = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }

  return trimmed;
}

export const INITIAL_CATEGORIES = [
  { id: 'all', name: 'Semua Menu', icon: 'Coffee' },
  { id: 'es-kopi', name: 'Es Kopi Susu', icon: 'CupSoda' },
  { id: 'kopi-panas', name: 'Kopi Panas', icon: 'Flame' },
  { id: 'non-kopi', name: 'Non-Coffee', icon: 'Milk' },
  { id: 'makanan', name: 'Snack & Pastry', icon: 'Cookie' },
  { id: 'bundling', name: 'Paket Bundling', icon: 'Sparkles' },
  { id: 'promo', name: 'Menu Promo', icon: 'Tag' },
  { id: 'topping', name: 'Topping & Extra', icon: 'PlusCircle' },
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    categoryId: 'es-kopi',
    name: 'Kopi Susu Kita',
    price: 18000,
    costPrice: 8000,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    description: 'Espresso blend, susu segar, dan gula aren organik asli.',
    isAvailable: true,
    isBestSeller: true,
    isBaristasChoice: false,
  },
  {
    id: 'prod-2',
    categoryId: 'es-kopi',
    name: 'Latte Gula Aren',
    price: 24000,
    costPrice: 10000,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
    description: 'Espresso berpadu dengan sirup vanila dan susu dingin.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: true,
  },
  {
    id: 'prod-3',
    categoryId: 'es-kopi',
    name: 'Iced Americano',
    price: 16000,
    costPrice: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    description: 'Double shot espresso dengan air dingin dan es batu segar.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: false,
  },
  {
    id: 'prod-4',
    categoryId: 'kopi-panas',
    name: 'Hot Cappuccino',
    price: 22000,
    costPrice: 9000,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
    description: 'Espresso seimbang dengan steamed milk dan foam tebal lembut bertabur kakao.',
    isAvailable: true,
    isBestSeller: true,
    isBaristasChoice: false,
  },
  {
    id: 'prod-5',
    categoryId: 'kopi-panas',
    name: 'Hot Cafe Latte',
    price: 22000,
    costPrice: 9000,
    imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
    description: 'Espresso dengan susu lembut dan latte art cantik.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: true,
  },
  {
    id: 'prod-6',
    categoryId: 'non-kopi',
    name: 'Iced Matcha Latte',
    price: 24000,
    costPrice: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    description: 'Matcha Uji Jepang premium dengan susu segar dingin.',
    isAvailable: true,
    isBestSeller: true,
    isBaristasChoice: false,
  },
  {
    id: 'prod-7',
    categoryId: 'non-kopi',
    name: 'Signature Chocolate',
    price: 22000,
    costPrice: 9000,
    imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80',
    description: 'Cokelat Belgia pekat dengan susu murni yang creamy.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: false,
  },
  {
    id: 'prod-8',
    categoryId: 'makanan',
    name: 'Pisang Goreng',
    price: 12000,
    costPrice: 4000,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    description: 'Pisang kepok goreng krispi manis gurih.',
    isAvailable: true,
    isBestSeller: true,
    isBaristasChoice: false,
  },
  {
    id: 'prod-9',
    categoryId: 'makanan',
    name: 'Butter Croissant',
    price: 18000,
    costPrice: 8500,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    description: 'Pastry renyah berlapis dengan aroma mentega Prancis harum.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: true,
  },
  {
    id: 'prod-10',
    categoryId: 'makanan',
    name: 'Kentang Goreng (French Fries)',
    price: 16000,
    costPrice: 6000,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
    description: 'Kentang goreng gurih garing disajikan dengan saus sambal.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: false,
  },
  {
    id: 'prod-11',
    categoryId: 'bundling',
    name: 'Paket Ngopi Hemat (Kopi Susu + Pisang)',
    price: 25000,
    costPrice: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    description: 'Hemat Rp 5.000: 1 Kopi Susu Kita + 1 Porsi Pisang Goreng krispi.',
    isAvailable: true,
    isBestSeller: true,
    isBaristasChoice: false,
  },
  {
    id: 'prod-12',
    categoryId: 'promo',
    name: 'Promo Kopi Gula Aren Jumbo',
    price: 19000,
    costPrice: 9000,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
    description: 'Harga spesial bulan ini untuk segelas Latte Gula Aren dingin ukuran jumbo.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: true,
  },
  {
    id: 'prod-13',
    categoryId: 'topping',
    name: 'Extra Espresso Shot',
    price: 5000,
    costPrice: 2000,
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80',
    description: 'Tambahan 1 shot espresso pekat.',
    isAvailable: true,
    isBestSeller: false,
    isBaristasChoice: false,
  },
];

export const INITIAL_SETTINGS = {
  storeName: 'Kopi Kita',
  storeSlogan: 'Warung Kopi Premium',
  storeAddress: 'Jl. Merdeka No. 12',
  storePhone: '0812-3456-7890',
  wifiName: 'KopiKita_Free',
  wifiPass: 'kopienak123',
  cashierName: 'Barista 1',
  receiptFooter: 'Terima kasih atas kunjungan Anda\n~ Kopi Kita ~',
  printerWidth: '58mm', // '58mm' or '80mm'
  showWifiOnReceipt: true,
  showCustomerOnReceipt: true,
  invoicePrefix: 'KK',
  qrisImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126590013ID.LINKAJA.WWW011893600911002239470802081022394751440014ID.CO.QRIS.WWW0215ID10200234567890303UME5204581253033605802ID5914KOPI%20SENJA6007JAKARTA61051234062070703A0163047B49',
  qrisMerchantName: 'KOPI KITA COFFEE SHOP',
  googleScriptUrl: '', // URL Web App dari Google Apps Script
  autoSyncCloud: true,
};

export const INITIAL_USERS = [
  {
    id: 'user-owner',
    name: 'Owner',
    role: 'owner', // 'owner', 'admin', 'kasir'
    pin: '123456',
    avatar: '👑',
  },
  {
    id: 'user-admin',
    name: 'Admin Kedai',
    role: 'admin',
    pin: '1234',
    avatar: '🛠️',
  },
  {
    id: 'user-kasir-1',
    name: 'Budi',
    role: 'kasir',
    pin: '1234',
    avatar: '☕',
  },
  {
    id: 'user-kasir-2',
    name: 'Siti',
    role: 'kasir',
    pin: '1234',
    avatar: '☕',
  },
];
