import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Truck, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  Tag
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { Supplier } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Suppliers: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    category: 'Bunga Segar'
  });

  // Reactive Query
  const allSuppliers = useLiveQuery(() => db.suppliers.toArray());
  
  const suppliers = allSuppliers?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = suppliers === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setShowNotification({ message: 'Nama dan Nomor Telepon wajib diisi!', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const supplierData: Supplier = {
        id: editingSupplier?.id || Math.random().toString(36).substring(2, 15),
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        category: formData.category
      };

      await db.suppliers.put(supplierData);

      setShowNotification({ message: `Supplier "${supplierData.name}" berhasil disimpan!`, type: 'success' });
      setTimeout(() => setShowNotification(null), 3000);
      closeModal();
    } catch (error) {
      console.error('Error saving supplier:', error);
      setShowNotification({ message: 'Gagal menyimpan supplier.', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone,
        address: supplier.address,
        category: supplier.category
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        category: 'Bunga Segar'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await db.suppliers.delete(id);
      setShowNotification({ message: 'Supplier berhasil dihapus!', type: 'success' });
      setTimeout(() => setShowNotification(null), 3000);
    } catch (error) {
      console.error('Delete failed:', error);
      setShowNotification({ message: 'Gagal menghapus supplier.', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 transition-colors">Kelola Supplier</h2>
          <p className="text-slate-500 text-sm transition-colors">Manajemen daftar pemasok bunga dan perlengkapan</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari supplier..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Tambah Supplier</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 transition-colors">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Supplier</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kontak</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Alamat</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : suppliers.length > 0 ? (
                suppliers.map((supplier, idx) => (
                  <tr 
                    key={supplier.id} 
                    className={cn(
                      "group transition-colors hover:bg-emerald-50/30",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-800 transition-colors">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-medium">{supplier.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span className="text-xs truncate">{supplier.address || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(supplier)}
                          className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSupplierToDelete(supplier)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Truck className="w-10 h-10 text-slate-200" />
                      </div>
                      <h4 className="font-bold text-slate-800">Belum ada supplier</h4>
                      <p className="text-sm text-slate-400">Daftarkan supplier Anda untuk mempermudah pencatatan pembelian barang.</p>
                      <button onClick={() => openModal()} className="text-emerald-600 font-bold text-sm hover:underline">
                        Tambah Supplier Sekarang
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
                      {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                    </h3>
                    <p className="text-slate-500 text-sm">Informasi kontak dan kategori pemasok</p>
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nama Supplier / Perusahaan</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800"
                        placeholder="Contoh: CV Bunga Harapan"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nomor Telepon</label>
                        <input 
                          required
                          type="text" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800"
                          placeholder="0812..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 appearance-none"
                        >
                          <option value="Bunga Segar">Bunga Segar</option>
                          <option value="Perlengkapan">Perlengkapan</option>
                          <option value="Tanaman Pot">Tanaman Pot</option>
                          <option value="Dekorasi">Dekorasi</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Lengkap</label>
                      <textarea 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 min-h-[100px] resize-none"
                        placeholder="Alamat kantor atau gudang..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-[2] px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      {editingSupplier ? 'Simpan Perubahan' : 'Daftarkan Supplier'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {supplierToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSupplierToDelete(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 text-center text-slate-900">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black mb-2">Hapus Supplier?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Menghapus <span className="font-bold text-slate-800">"{supplierToDelete.name}"</span>? Riwayat pembelian yang terkait dengan supplier ini mungkin akan terpengaruh.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSupplierToDelete(null)} className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200">BATAL</button>
                <button onClick={() => { handleDelete(supplierToDelete.id); setSupplierToDelete(null); }} className="py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200">HAPUS</button>
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
