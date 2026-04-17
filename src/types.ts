export interface Product {
  id: string;
  name: string;
  purchasePrice?: number;
  price: number;
  stock: number;
  unit: string; // e.g. Tangkai, Buket, Pot
  category: string;
  imageUrl?: string;
  createdAt: number;
}

export interface StockHistory {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  referenceId?: string; // Transaction ID or Purchase ID
  note?: string;
  timestamp: number;
}

export interface CartItem extends Product {
  jumlah: number;
}

export interface Transaction {
  id: string;
  itemDibeli: CartItem[];
  totalHarga: number;
  nominalBayar?: number;
  kembalian?: number;
  metodePembayaran: 'cash' | 'transfer' | 'qris';
  tanggal: number;
}

export interface ShopSettings {
  id?: number;
  namaToko: string;
  logoBase64?: string;
  alamat?: string;
  telepon?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  marginType: 'percentage' | 'nominal';
  marginValue: number;
  ppn?: number;
  lowStockThreshold: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
}

export interface PurchaseItem {
  productId: string;
  qty: number;
  purchasePrice: number;
  name?: string; // Cache name for history
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName?: string; // Cache name for history
  date: number;
  items: PurchaseItem[];
  grandTotal: number;
}

export type View = 'dashboard' | 'products' | 'pos' | 'history' | 'settings' | 'reports' | 'suppliers' | 'purchases' | 'inventory' | 'customer' | 'login';
