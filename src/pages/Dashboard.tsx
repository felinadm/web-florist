import React from 'react';
import { TrendingUp, ShoppingBag, Flower2, AlertCircle, ArrowUpRight, ArrowDownRight, History as HistoryIcon } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const stats = useLiveQuery(async () => {
    const products = await db.products.toArray();
    const transactions = await db.transactions.toArray();
    
    const totalSales = transactions.reduce((acc, curr) => acc + curr.totalHarga, 0);
    const lowStockCount = products.filter(p => p.stok < 5).length;
    const activeProducts = products.filter(p => p.stok > 0).length;

    return {
      totalSales,
      totalTransactions: transactions.length,
      lowStockCount,
      totalProducts: activeProducts,
      recentTransactions: transactions.slice(-5).reverse()
    };
  });

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
    </div>
  );

  const statCards = [
    { 
      label: 'Total Pendapatan', 
      value: formatCurrency(stats.totalSales), 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      trend: '+12.5%',
      isUp: true
    },
    { 
      label: 'Jumlah Transaksi', 
      value: stats.totalTransactions.toString(), 
      icon: ShoppingBag, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      trend: '+5.2%',
      isUp: true
    },
    { 
      label: 'Stok Kritis (<5)', 
      value: stats.lowStockCount.toString(), 
      icon: AlertCircle, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      trend: stats.lowStockCount > 0 ? 'Perlu Cek' : 'Aman',
      isUp: stats.lowStockCount === 0
    },
    { 
      label: 'Produk Aktif', 
      value: stats.totalProducts.toString(), 
      icon: Flower2, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      trend: 'Tersedia',
      isUp: true
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-900">Dashboard</h2>
        <p className="text-slate-500 font-medium">Pantau performa toko bunga Anda hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className={cn(
                "flex items-center text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
                stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                <HistoryIcon className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-800">Transaksi Terbaru</h3>
            </div>
            <button className="text-sm text-rose-600 font-black hover:underline tracking-tight">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Transaksi</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentTransactions.length > 0 ? stats.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-rose-50/30 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-slate-900">#{tx.id.slice(-6)}</td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                      {new Date(tx.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase tracking-tighter">
                        {tx.metodePembayaran}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-rose-600 text-right">{formatCurrency(tx.totalHarga)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <ShoppingBag className="w-12 h-12 mb-4 opacity-10" />
                        <p className="text-sm font-bold">Belum ada transaksi hari ini</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-[40px] p-8 text-white shadow-2xl shadow-rose-200 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <h3 className="font-black text-xl mb-3 relative z-10">Tips Florist</h3>
            <p className="text-rose-100 text-sm leading-relaxed font-medium relative z-10">
              Bunga Lily dan Mawar membutuhkan suhu ruangan yang sejuk. Pastikan stok Anda tetap segar untuk menjaga kualitas premium Zhuxin.
            </p>
            <button className="mt-6 bg-white text-rose-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-rose-50 transition-all active:scale-95 relative z-10 shadow-lg">
              CEK INVENTARIS
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-rose-500 rounded-full" />
              Status Sistem
            </h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Database Lokal</span>
                <span className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Penyimpanan</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">98% Tersedia</span>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[98%] h-full bg-rose-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
