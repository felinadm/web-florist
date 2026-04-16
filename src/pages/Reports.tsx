import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { formatCurrency, exportToCSV } from '../lib/utils';
import { TrendingUp, DollarSign, ShoppingBag, Users, Download, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export const Reports: React.FC = () => {
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const stats = React.useMemo(() => {
    if (!transactions) return { totalSales: 0, orderCount: 0, averageOrder: 0, growth: 0 };
    
    const totalSales = transactions.reduce((acc, curr) => acc + curr.totalHarga, 0);
    const orderCount = transactions.length;
    const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;
    
    return {
      totalSales,
      orderCount,
      averageOrder,
      growth: 12.5 // Simulated growth
    };
  }, [transactions]);

  const salesByDay = React.useMemo(() => {
    if (!transactions) return [];
    
    const days: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('id-ID', { weekday: 'short' });
    }).reverse();
    
    last7Days.forEach(day => days[day] = 0);
    
    transactions.forEach(tx => {
      const day = new Date(tx.tanggal).toLocaleDateString('id-ID', { weekday: 'short' });
      if (days[day] !== undefined) {
        days[day] += tx.totalHarga;
      }
    });
    
    return Object.entries(days).map(([name, total]) => ({ name, total }));
  }, [transactions]);

  const salesByCategory = React.useMemo(() => {
    if (!transactions) return [];
    
    const categories: Record<string, number> = {};
    transactions.forEach(tx => {
      tx.itemDibeli.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + (item.price * item.jumlah);
      });
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const topProducts = React.useMemo(() => {
    if (!transactions) return [];
    
    const productSales: Record<string, { name: string, total: number, count: number }> = {};
    transactions.forEach(tx => {
      tx.itemDibeli.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, total: 0, count: 0 };
        }
        productSales[item.id].total += (item.price * item.jumlah);
        productSales[item.id].count += item.jumlah;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  const handleExportAll = () => {
    if (!transactions) return;
    const exportData = transactions.map(tx => ({
      ID: tx.id,
      Tanggal: new Date(tx.tanggal).toLocaleString(),
      Metode: tx.metodePembayaran,
      Total: tx.totalHarga,
      ItemCount: tx.itemDibeli.length
    }));
    exportToCSV(exportData, `Laporan-Lengkap-${new Date().toISOString().split('T')[0]}`);
  };

  const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fff1f2'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-slate-900">Analisis & Laporan</h2>
          <p className="text-slate-500 font-medium">Pantau performa penjualan Zhuxin Florist Anda.</p>
        </div>
        <button 
          onClick={handleExportAll}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <Download className="w-4 h-4" />
          Ekspor Laporan Lengkap (CSV)
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Penjualan', value: formatCurrency(stats.totalSales), icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Total Pesanan', value: stats.orderCount, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rata-rata Order', value: formatCurrency(stats.averageOrder), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pertumbuhan', value: `+${stats.growth}%`, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                Real-time
              </span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900">Tren Penjualan (7 Hari Terakhir)</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Calendar className="w-4 h-4" />
              Minggu Ini
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `Rp ${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  formatter={(value: number) => [formatCurrency(value), 'Penjualan']}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#e11d48" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#e11d48', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8">Distribusi Produk</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {salesByCategory.slice(0, 3).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600">{cat.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Produk Terlaris</h3>
          <button className="text-xs font-black text-rose-600 uppercase tracking-widest hover:text-rose-700 underline underline-offset-4">Lihat Semua</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Produk</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Terjual</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xs">
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-black text-slate-600">
                      {p.count} Pcs
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-sm font-black text-rose-600">{formatCurrency(p.total)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
