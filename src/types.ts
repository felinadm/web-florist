export interface Product {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  kategori: string;
  urlGambar?: string;
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

export type View = 'dashboard' | 'products' | 'pos' | 'history' | 'settings' | 'customer' | 'login';
