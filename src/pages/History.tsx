import React, { useState } from 'react';
import { Search, Calendar, Download, Eye, FileText, Flower2, ShoppingBag, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const History: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const transactions = useLiveQuery(
    () => db.transactions
      .reverse()
      .filter(tx => 
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.metodePembayaran.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .toArray(),
    [searchTerm]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-900">Riwayat Pesanan</h2>
        <p className="text-slate-500 font-medium">Daftar semua transaksi bunga yang telah diproses.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari ID transaksi atau metode..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Pilih Tanggal</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">
            <Download className="w-4 h-4" />
            <span className="text-sm">Ekspor Laporan</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaksi</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu & Tanggal</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions === undefined ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
                  </td>
                </tr>
              ) : transactions.length > 0 ? transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-rose-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">#{tx.id.slice(-8)}</p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sukses</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-slate-700 font-bold">
                      {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(tx.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      tx.metodePembayaran === 'cash' ? "bg-emerald-50 text-emerald-700" :
                      tx.metodePembayaran === 'qris' ? "bg-purple-50 text-purple-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {tx.metodePembayaran}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-slate-600 font-bold">{tx.itemDibeli.length} Produk</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="text-sm font-black text-rose-600">{formatCurrency(tx.totalHarga)}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => setSelectedTx(tx)}
                      className="p-3 hover:bg-rose-100 rounded-2xl text-slate-400 hover:text-rose-600 transition-all active:scale-90"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-lg font-black">Belum ada riwayat transaksi</p>
                      <p className="text-sm font-medium mt-1">Mulai jualan bunga untuk melihat riwayat di sini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[48px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Flower2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Detail Transaksi</h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">ID: #{selectedTx.id}</p>
                </div>

                <div className="space-y-5 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedTx.itemDibeli.map((item) => (
                    <div key={item.id} className="flex justify-between items-start group">
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-800 group-hover:text-rose-600 transition-colors">{item.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.jumlah} x {formatCurrency(item.price)}</p>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(item.price * item.jumlah)}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-dashed border-slate-200 space-y-4">
                  <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span>Metode Pembayaran</span>
                    <span className="text-rose-600">{selectedTx.metodePembayaran}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span>Waktu Transaksi</span>
                    <span className="text-slate-800">
                      {new Date(selectedTx.tanggal).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-2xl font-black text-slate-900 pt-6 border-t border-slate-100">
                    <span>Total</span>
                    <span className="text-rose-600">{formatCurrency(selectedTx.totalHarga)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedTx(null)}
                  className="w-full mt-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                >
                  TUTUP DETAIL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
