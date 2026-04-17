export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  createdAt: number;
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

export type View = 'dashboard' | 'products' | 'pos' | 'history' | 'settings' | 'reports' | 'suppliers' | 'purchases' | 'customer' | 'login';
