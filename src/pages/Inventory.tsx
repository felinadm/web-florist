import React, { useState } from 'react';
import { 
  Package, 
  History, 
  AlertTriangle, 
  Search, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  FileText,
  Filter,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { Product, StockHistory } from '../types';
import { formatCurrency, cn, DEFAULT_FLOWER_IMAGE } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type InventoryTab = 'dashboard' | 'opname' | 'history';

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // Stock Opname Form State
  const [opnameProductId, setOpnameProductId] = useState('');
  const [opnameType, setOpnameType] = useState<'IN' | 'OUT'>('IN');
  const [opnameQty, setOpnameQty] = useState('');
  const [opnameNote, setOpnameNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reactive Queries
  const products = useLiveQuery(() => db.products.toArray());
  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());
  const stockHistory = useLiveQuery(() => db.stockHistory.orderBy('timestamp').reverse().toArray());

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockThreshold = shopSettings?.lowStockThreshold || 5;

  const handleOpnameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameProductId || !opnameQty || !opnameNote) {
      setShowNotification({ message: 'Lengkapi semua field!', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
      return;
    }

      setIsSubmitting(true);
    try {
      const product = products?.find(p => p.id === opnameProductId);
      if (!product) {
        setShowNotification({ message: 'Pilih produk terlebih dahulu!', type: 'error' });
        setTimeout(() => setShowNotification(null), 3000);
        setIsSubmitting(false);
        return;
      }

      const qty = parseInt(opnameQty);
      if (isNaN(qty) || qty <= 0) {
        setShowNotification({ message: 'Jumlah harus angka positif!', type: 'error' });
        setTimeout(() => setShowNotification(null), 3000);
        setIsSubmitting(false);
        return;
      }

      const newStock = opnameType === 'IN' ? product.stock + qty : product.stock - qty;

      if (newStock < 0) {
        setShowNotification({ message: 'Stok tidak boleh kurang dari 0!', type: 'error' });
        setTimeout(() => setShowNotification(null), 3000);
        setIsSubmitting(false);
        return;
      }

      await db.transaction('rw', [db.products, db.stockHistory], async () => {
        // 1. Update Stock
        await db.products.update(opnameProductId, { stock: newStock });

        // 2. Add History Entry
        await db.stockHistory.add({
          id: Math.random().toString(36).substring(2, 15),
          productId: opnameProductId,
          type: 'ADJUST',
          quantity: opnameType === 'IN' ? qty : -qty,
          note: `Penyesuaian Manual: ${opnameNote}`,
          timestamp: Date.now()
        });
      });

      setShowNotification({ message: 'Stok berhasil disesuaikan!', type: 'success' });
      setTimeout(() => setShowNotification(null), 3000);
      
      // Reset Form
      setOpnameProductId('');
      setOpnameQty('');
      setOpnameNote('');
    } catch (error) {
      console.error('Opname failed:', error);
      setShowNotification({ message: 'Gagal menyesuaikan stok.', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Habis', color: 'text-red-600 bg-red-50 border-red-100', icon: AlertTriangle };
    if (stock < lowStockThreshold) return { label: 'Menipis', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: AlertTriangle };
    return { label: 'Aman', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 };
  };

  const historyByProduct = selectedProductId 
    ? stockHistory?.filter(h => h.productId === selectedProductId)
    : stockHistory;

  return (
    <div className="space-y-8 pb-20 text-slate-900">
      {/* Header Area */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black transition-colors tracking-tight">Stok & Inventaris</h2>
        <p className="text-slate-500 font-medium transition-colors">Monitor pergerakan barang dan optimalkan ketersediaan produk.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[24px] border border-slate-200 w-fit">
        {[
          { id: 'dashboard', label: 'Ringkasan Stok', icon: Package },
          { id: 'opname', label: 'Stock Opname', icon: Filter },
          { id: 'history', label: 'Kartu Stok', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as InventoryTab)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-rose-500" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Produk</p>
                  <p className="text-2xl font-black text-slate-900">{products?.length || 0}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok Menipis</p>
                  <p className="text-2xl font-black text-slate-900">{products?.filter(p => p.stock > 0 && p.stock < lowStockThreshold).length || 0}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <X className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok Habis</p>
                  <p className="text-2xl font-black text-slate-900">{products?.filter(p => p.stock <= 0).length || 0}</p>
                </div>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Inventaris Barang</h3>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari nama produk..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produk</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok Saat Ini</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProducts?.map((p) => {
                      const status = getStockStatus(p.stock);
                      const StatusIcon = status.icon;
                      return (
                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                {p.imageUrl ? (
                                  <img 
                                    src={p.imageUrl} 
                                    alt={p.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = DEFAULT_FLOWER_IMAGE;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <span className="font-black text-slate-800 tracking-tight">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="font-black text-lg text-slate-900">{p.stock}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{p.unit || 'Unit'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                              status.color
                            )}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button 
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setActiveTab('history');
                              }}
                              className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'opname' && (
          <motion.div
            key="opname"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                <div>
                  <h3 className="text-xl font-black tracking-tight">Adjustment</h3>
                  <p className="text-slate-500 text-xs font-medium mt-1">Sesuaikan stok manual dengan alasan tertentu.</p>
                </div>

                <form onSubmit={handleOpnameSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="opname-product" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Produk</label>
                    <select 
                      id="opname-product"
                      name="productId"
                      value={opnameProductId}
                      onChange={(e) => setOpnameProductId(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                    >
                      <option value="">Pilih Produk...</option>
                      {products?.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock} {p.unit})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipe Penyesuaian</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button 
                        type="button"
                        id="type-in"
                        onClick={() => setOpnameType('IN')}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2",
                          opnameType === 'IN' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "text-slate-500"
                        )}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        STOK MASUK
                      </button>
                      <button 
                        type="button"
                        id="type-out"
                        onClick={() => setOpnameType('OUT')}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2",
                          opnameType === 'OUT' ? "bg-red-600 text-white shadow-lg shadow-red-100" : "text-slate-500"
                        )}
                      >
                        <Minus className="w-3.5 h-3.5" />
                        STOK KELUAR
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="opname-qty" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Jumlah Perubahan</label>
                    <input 
                      id="opname-qty"
                      name="quantity"
                      type="number" 
                      value={opnameQty}
                      onChange={(e) => setOpnameQty(e.target.value)}
                      placeholder="Masukkan angka..."
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="opname-note" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alasan Penyesuaian</label>
                    <textarea 
                      id="opname-note"
                      name="note"
                      value={opnameNote}
                      onChange={(e) => setOpnameNote(e.target.value)}
                      placeholder="Contoh: Barang rusak, bonus supplier, hilang, dll..."
                      rows={3}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    {isSubmitting ? 'MEMPROSES...' : 'SIMPAN PENYESUAIAN'}
                  </button>
                </form>
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 flex gap-6">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-900">Apa itu Stock Opname?</h4>
                  <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                    Stock Opname adalah proses mencocokkan jumlah stok fisik di gudang dengan catatan di sistem. 
                    Lakukan ini secara berkala untuk mendeteksi barang hilang atau rusak.
                  </p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-900">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Log Penyesuaian Terakhir</h3>
                 </div>
                 <div className="space-y-4">
                    {stockHistory?.filter(h => h.type === 'ADJUST').slice(0, 5).map((log) => {
                       const prod = products?.find(p => p.id === log.productId);
                       return (
                         <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className={cn(
                                 "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                                 log.quantity > 0 ? "bg-emerald-500" : "bg-red-500"
                               )}>
                                  {log.quantity > 0 ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-800 text-sm">{prod?.name || 'Produk Dihapus'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">{log.note}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className={cn("font-black", log.quantity > 0 ? "text-emerald-600" : "text-red-600")}>
                                  {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                               </p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleDateString()}</p>
                            </div>
                         </div>
                       );
                    })}
                    {(stockHistory?.filter(h => h.type === 'ADJUST').length === 0) && (
                      <div className="py-20 text-center opacity-30">
                        <History className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-xs font-black uppercase tracking-widest">Belum ada log penyesuaian</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter & Selector */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight">Kartu Stok Detil</h3>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Lacak Pergerakan Barang</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <label htmlFor="history-product-filter" className="sr-only">Filter Produk</label>
                  <select 
                    id="history-product-filter"
                    name="selectedProduct"
                    value={selectedProductId || ''}
                    onChange={(e) => setSelectedProductId(e.target.value || null)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-slate-900/5 font-bold text-sm min-w-[240px]"
                  >
                    <option value="">Semua Produk</option>
                    {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {selectedProductId && (
                    <button onClick={() => setSelectedProductId(null)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200">
                       <X className="w-4 h-4" />
                    </button>
                  )}
               </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                       <th className="px-8 py-6">Waktu</th>
                       <th className="px-8 py-6 text-center">Tipe</th>
                       <th className="px-8 py-6">Produk</th>
                       <th className="px-8 py-6 text-center">Jumlah</th>
                       <th className="px-8 py-6">Keterangan</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {historyByProduct?.map((h) => {
                       const prod = products?.find(p => p.id === h.productId);
                       return (
                         <tr key={h.id} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6 whitespace-nowrap">
                             <div className="flex flex-col">
                               <span className="font-bold text-sm text-slate-900">{new Date(h.timestamp).toLocaleDateString('id-ID')}</span>
                               <span className="text-[10px] text-slate-400 font-bold">{new Date(h.timestamp).toLocaleTimeString('id-ID')}</span>
                             </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <div className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                h.type === 'IN' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                h.type === 'OUT' ? "bg-red-50 text-red-600 border border-red-100" :
                                "bg-blue-50 text-blue-600 border border-blue-100"
                              )}>
                                {h.type === 'IN' && <ArrowDownLeft className="w-3 h-3" />}
                                {h.type === 'OUT' && <ArrowUpRight className="w-3 h-3" />}
                                {h.type === 'ADJUST' && <RefreshCw className="w-3 h-3" />}
                                {h.type === 'IN' ? 'Masuk' : h.type === 'OUT' ? 'Keluar' : 'Penyesuaian'}
                              </div>
                           </td>
                           <td className="px-8 py-6 font-bold text-sm text-slate-700">{prod?.name || 'Produk Dihapus'}</td>
                           <td className={cn(
                             "px-8 py-6 text-center font-black text-lg",
                             h.quantity > 0 ? "text-emerald-600" : "text-red-600"
                           )}>
                             {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                           </td>
                           <td className="px-8 py-6">
                             <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                               <FileText className="w-3.5 h-3.5 text-slate-300" />
                               <span className="text-xs font-medium text-slate-500">{h.note || '-'}</span>
                             </div>
                           </td>
                         </tr>
                       );
                     })}
                     {(!historyByProduct || historyByProduct.length === 0) && (
                       <tr>
                         <td colSpan={5} className="py-32 text-center">
                           <div className="max-w-xs mx-auto space-y-4 opacity-30">
                              <History className="w-16 h-16 mx-auto" />
                              <p className="text-sm font-black uppercase tracking-widest text-slate-400">Tidak ada riwayat pergerakan</p>
                           </div>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
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
              {showNotification.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
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
