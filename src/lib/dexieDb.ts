import Dexie, { Table } from 'dexie';
import { Product, Transaction, ShopSettings } from '../types';

export class UMKMDatabase extends Dexie {
  products!: Table<Product>;
  transactions!: Table<Transaction>;
  settings!: Table<ShopSettings>;

  constructor() {
    super('UMKMFloristDB_v2');
    this.version(1).stores({
      products: 'id, nama, kategori',
      transactions: 'id, tanggal',
      settings: '++id'
    });
  }
}

export const db = new UMKMDatabase();
