import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  X, 
  Upload, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { Product } from '../types';
import { formatCurrency, formatNumber, parseNumber, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const ProductManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    harga: '',
    stok: '',
    kategori: 'Umum',
    gambar: ''
  });

  // Reactive Query with Dexie
  const allProducts = useLiveQuery(() => db.products.toArray());
  
  const products = allProducts?.filter(p => 
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const isLoading = products === undefined;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, gambar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.harga || !formData.stok) {
      setShowNotification({ message: 'Nama, Harga, dan Stok wajib diisi!', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const productData: Product = {
        id: editingProduct?.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        nama: formData.nama,
        harga: parseNumber(formData.harga),
        stok: parseNumber(formData.stok),
        kategori: formData.kategori,
        urlGambar: formData.gambar || undefined,
        createdAt: editingProduct?.createdAt || Date.now()
      };

      // Use put for both add and update
      await db.products.put(productData);

      setShowNotification({ message: `Produk "${productData.nama}" berhasil disimpan!`, type: 'success' });
      setTimeout(() => setShowNotification(null), 3000);
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      setShowNotification({ message: 'Gagal menyimpan produk. Silakan coba lagi.', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nama: product.nama,
        harga: formatNumber(product.harga),
        stok: formatNumber(product.stok),
        kategori: product.kategori,
        gambar: product.urlGambar || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nama: '',
        harga: '',
        stok: '',
        kategori: 'Umum',
        gambar: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await db.products.delete(id);
      setShowNotification({ message: 'Produk berhasil dihapus!', type: 'success' });
      setTimeout(() => setShowNotification(null), 3000);
    } catch (error) {
      console.error('Delete failed:', error);
      setShowNotification({ message: 'Gagal menghapus produk.', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  const getStockBadge = (stok: number) => {
    if (stok < 5) return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">Kritis</span>;
    if (stok < 10) return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">Menipis</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Aman</span>;
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Kelola Produk</h2>
          <p className="text-slate-500 text-sm">Atur inventaris UMKM Anda dengan mudah</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari bunga..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Produk</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Harga</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stok</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                // Skeleton Loading
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                        <div className="h-4 bg-slate-100 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : products.length > 0 ? (
                products.map((product, idx) => (
                  <tr 
                    key={product.id} 
                    className={cn(
                      "group transition-colors hover:bg-rose-50/30",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                          {product.urlGambar ? (
                            <img 
                              src={product.urlGambar} 
                              alt={product.nama} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-slate-800 truncate max-w-[200px]">{product.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {product.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900">{formatCurrency(product.harga)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-700">{product.stok} Unit</span>
                        {getStockBadge(product.stok)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(product)}
                          className="p-2 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setProductToDelete(product)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                // Empty State
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Package className="w-10 h-10 text-slate-200" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Belum ada produk</h4>
                        <p className="text-sm text-slate-400">Mulai tambahkan produk pertama Anda untuk berjualan.</p>
                      </div>
                      <button 
                        onClick={() => openModal()}
                        className="text-rose-600 font-bold text-sm hover:underline"
                      >
                        Tambah Produk Sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">
                      {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h3>
                    <p className="text-slate-500 text-sm">Lengkapi detail informasi produk di bawah ini</p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div className="flex flex-col items-center">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all overflow-hidden group relative"
                    >
                      {formData.gambar ? (
                        <>
                          <img src={formData.gambar} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Foto</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nama Produk</label>
                      <input 
                        required
                        type="text" 
                        value={formData.nama}
                        onChange={(e) => setFormData({...formData, nama: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                        placeholder="Contoh: Buket Mawar Merah"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Harga (Rp)</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                          <input 
                            required
                            type="text" 
                            value={formData.harga}
                            onChange={(e) => {
                              const val = parseNumber(e.target.value);
                              setFormData({...formData, harga: formatNumber(val)});
                            }}
                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Stok</label>
                        <input 
                          required
                          type="text" 
                          value={formData.stok}
                          onChange={(e) => {
                            const val = parseNumber(e.target.value);
                            setFormData({...formData, stok: val === 0 ? '' : formatNumber(val)});
                          }}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
                      <select 
                        value={formData.kategori}
                        onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 appearance-none"
                      >
                        <option value="Buket">Buket</option>
                        <option value="Satuan">Satuan</option>
                        <option value="Tanaman Pot">Tanaman Pot</option>
                        <option value="Dekorasi">Dekorasi</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] px-6 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Produk?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-800">"{productToDelete.nama}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  BATAL
                </button>
                <button 
                  onClick={() => {
                    if (productToDelete) {
                      handleDelete(productToDelete.id);
                      setProductToDelete(null);
                    }
                  }}
                  className="py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200"
                >
                  HAPUS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm",
              showNotification.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            )}
          >
            {showNotification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {showNotification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
