import Dexie, { Table } from 'dexie';
import { Product, Transaction, ShopSettings } from '../types';

export class UMKMDatabase extends Dexie {
  products!: Table<Product>;
  transactions!: Table<Transaction>;
  settings!: Table<ShopSettings>;

  constructor() {
    super('UMKMFloristDB_v2');
    this.version(1).stores({
      products: 'id, name, category',
      transactions: 'id, tanggal',
      settings: '++id'
    });

    // Initial data population using hotlinking from stable sources
    this.on('populate', () => {
      this.products.bulkAdd([
        { id: '1', name: 'Buket Mawar Merah Premium', price: 250000, stock: 15, category: 'Buket', imageUrl: 'https://images.unsplash.com/photo-1548610762-7c6abc9d6d6f?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '2', name: 'Bunga Matahari (Sunflower)', price: 45000, stock: 15, category: 'Satuan', imageUrl: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '3', name: 'Anggrek Bulan Putih', price: 250000, stock: 10, category: 'Tanaman Pot', imageUrl: 'https://images.unsplash.com/photo-1599232458812-5883e7d32e6d?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '4', name: 'Buket Tulip Pastel', price: 350000, stock: 5, category: 'Buket', imageUrl: 'https://images.unsplash.com/photo-1523694576729-dc99e2c01707?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '5', name: 'Bunga Lily Casablanca', price: 85000, stock: 12, category: 'Satuan', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '6', name: 'Bunga Papan Ucapan Selamat', price: 750000, stock: 3, category: 'Bunga Papan', imageUrl: 'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '7', name: 'Rangkaian Bunga Meja', price: 450000, stock: 8, category: 'Bunga Meja', imageUrl: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '8', name: 'Buket Hydrangea Biru', price: 275000, stock: 6, category: 'Buket', imageUrl: 'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      ]);
      this.settings.add({
        namaToko: 'Zhuxin Florist',
        alamat: 'Jl. Bunga Melati No. 123, Jakarta',
        telepon: '+62 8974220209',
        email: 'hello@zhuxinflorist.com'
      });
    });
  }
}

export const db = new UMKMDatabase();
