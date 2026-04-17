import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  PackagePlus, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Truck,
  Flower2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  ShoppingCart
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { Product, Supplier, Purchase, PurchaseItem } from '../types';
import { formatCurrency, formatNumber, parseNumber, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Purchases: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  
  // Temp item selection
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  // Reactive Queries
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const allPurchases = useLiveQuery(() => db.purchases.toArray());
  
  const purchases = allPurchases?.sort((a, b) => b.date - a.date);

  const isLoading = purchases === undefined;

  const addItem = () => {
    if (!selectedProductId || !itemQty || !itemPrice) {
      setShowNotification({ message: 'Pilih produk, jumlah, dan harga!', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
      return;
    }

    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItem: PurchaseItem = {
      productId: selectedProductId,
      qty: parseNumber(itemQty),
      purchasePrice: parseNumber(itemPrice),
      name: product.name
    };

    setPurchaseItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setItemQty('');
    setItemPrice('');
  };

  const removeItem = (index: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const grandTotal = purchaseItems.reduce((acc, curr) => acc + (curr.purchasePrice * curr.qty), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setShowNotification({ message: 'Pilih supplier terlebih dahulu!', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
      return;
    }
    if (purchaseItems.length === 0) {
      setShowNotification({ message: 'Tambahkan minimal satu item barang!', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const supplier = suppliers?.find(s => s.id === selectedSupplierId);
      
      const purchaseData: Purchase = {
        id: Math.random().toString(36).substring(2, 15),
        supplierId: selectedSupplierId,
        supplierName: supplier?.name,
        date: Date.now(),
        items: purchaseItems,
        grandTotal: grandTotal
      };

      // 1. Save Purchase Record
      await db.purchases.put(purchaseData);

      // 2. Update Product Stocks, Purchase Prices, and Log History
      for (const item of purchaseItems) {
        const product = await db.products.get(item.productId);
        if (product) {
          // Update Product
          await db.products.update(item.productId, {
            stock: product.stock + item.qty,
            purchasePrice: item.purchasePrice
          });

          // Log History
          await db.stockHistory.add({
            id: Math.random().toString(36).substring(2, 15),
            productId: item.productId,
            type: 'IN',
            quantity: item.qty,
            referenceId: purchaseData.id,
            note: `Pembelian Supplier (ID #${purchaseData.id.slice(0, 8)})`,
            timestamp: Date.now()
          });
        }
      }

      setShowNotification({ message: 'Restok barang berhasil dicatat!', type: 'success' });
      setTimeout(() => setShowNotification(null), 3000);
      closeModal();
    } catch (error) {
      console.error('Error saving purchase:', error);
      setShowNotification({ message: 'Gagal mencatat pembelian.', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSupplierId('');
    setPurchaseItems([]);
    setSelectedProductId('');
    setItemQty('');
    setItemPrice('');
  };

  return (
    <div className="space-y-6 p-1 text-slate-900">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black transition-colors">Pembelian Barang (Restok)</h2>
          <p className="text-slate-500 text-sm transition-colors">Kelola stok masuk dari supplier Anda</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
        >
          <PackagePlus className="w-5 h-5" />
          Input Pembelian Baru
        </button>
      </div>

      {/* History Area */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Riwayat Restok</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 transition-colors">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Supplier</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Item Barang</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Total Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28"></div></td>
                  </tr>
                ))
              ) : purchases.length > 0 ? (
                purchases.map((p, idx) => (
                  <tr 
                    key={p.id} 
                    className={cn(
                      "group transition-colors hover:bg-blue-50/30",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{new Date(p.date).toLocaleDateString('id-ID')}</span>
                        <span className="text-[10px] text-slate-400">{new Date(p.date).toLocaleTimeString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-700">{p.supplierName || 'Umum'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 max-w-[300px]">
                        {p.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs px-2 py-1 bg-slate-100 rounded-md">
                            <span className="truncate">{item.name}</span>
                            <span className="font-black ml-2 whitespace-nowrap">+{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-blue-600">{formatCurrency(p.grandTotal)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <PackagePlus className="w-10 h-10 text-slate-200" />
                      </div>
                      <h4 className="font-bold">Belum ada riwayat pembelian</h4>
                      <p className="text-sm text-slate-400">Catat pembelian barang dari supplier untuk menambah stok secara otomatis.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Purchase Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              {/* Left Side: Form */}
              <div className="w-full md:w-[45%] p-8 border-r border-slate-100 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                  <h3 className="text-2xl font-black">Input Pembelian</h3>
                  <p className="text-slate-500 text-sm">Pilih supplier dan tambahkan item barang</p>
                </div>

                <div className="space-y-6">
                  {/* Supplier Selection */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Supplier</label>
                    <select 
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                    >
                      <option value="">Pilih Supplier...</option>
                      {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                    </select>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Item Input */}
                  <div className="space-y-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                       <Plus className="w-4 h-4" />
                       Tambah Item
                    </h4>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Produk</label>
                      <select 
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                      >
                        <option value="">Pilih Produk...</option>
                        {products?.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah</label>
                        <input 
                          type="text" 
                          value={itemQty}
                          onChange={(e) => setItemQty(formatNumber(parseNumber(e.target.value)))}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Harga Beli (Rp)</label>
                        <input 
                          type="text" 
                          value={itemPrice}
                          onChange={(e) => setItemPrice(formatNumber(parseNumber(e.target.value)))}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={addItem}
                      className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all active:scale-95 text-xs tracking-widest"
                    >
                      TAMBAHKAN KE DAFTAR
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side: Cart / Review */}
              <div className="w-full md:w-[55%] flex flex-col bg-slate-50/50">
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Review Barang Masuk</h4>
                    <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full">{purchaseItems.length} Item</span>
                  </div>

                  <div className="space-y-3">
                    {purchaseItems.length > 0 ? purchaseItems.map((item, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                            <Flower2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-800">{item.name}</h5>
                            <p className="text-[10px] text-slate-400">@{formatCurrency(item.purchasePrice)} x {item.qty}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-slate-900 text-sm">{formatCurrency(item.purchasePrice * item.qty)}</span>
                          <button onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-20 text-center opacity-30 flex flex-col items-center">
                        <ShoppingCart className="w-12 h-12 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Daftar item kosong</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-white border-t border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                    <span className="text-3xl font-black text-blue-600">{formatCurrency(grandTotal)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={closeModal} className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200">BATAL</button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || purchaseItems.length === 0}
                      className="py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackagePlus className="w-5 h-5" />}
                      SIMPAN PEMBELIAN
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notification Toast (SweetAlert Style) */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            className={cn(
              "fixed bottom-10 left-1/2 z-[300] px-8 py-4 rounded-[28px] shadow-2xl flex items-center gap-4 font-black text-sm text-white min-w-[320px] backdrop-blur-md border",
              showNotification.type === 'success' && "bg-emerald-600/90 border-emerald-400 shadow-emerald-200",
              showNotification.type === 'error' && "bg-red-600/90 border-red-400 shadow-red-200",
              showNotification.type === 'warning' && "bg-amber-500/90 border-amber-300 shadow-amber-200"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {showNotification.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {showNotification.type === 'error' && <X className="w-6 h-6" />}
              {showNotification.type === 'warning' && <AlertCircle className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="uppercase tracking-widest text-[10px] opacity-80 mb-0.5">
                {showNotification.type === 'success' ? 'Berhasil' : showNotification.type === 'error' ? 'Gagal' : 'Peringatan'}
              </p>
              <p className="leading-tight">{showNotification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
