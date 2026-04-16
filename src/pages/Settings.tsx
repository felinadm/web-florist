import React, { useState, useEffect } from 'react';
import { Camera, Save, Store, User, CheckCircle2, AlertCircle, RefreshCw, Trash2, Download, Upload, Phone } from 'lucide-react';
import { db } from '../lib/dexieDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());
  
  const [namaToko, setNamaToko] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (shopSettings) {
      setNamaToko(shopSettings.namaToko);
      setLogoBase64(shopSettings.logoBase64);
      setAlamat(shopSettings.alamat || '');
      setTelepon(shopSettings.telepon || '');
      setInstagram(shopSettings.instagram || '');
      setWhatsapp(shopSettings.whatsapp || '');
      setEmail(shopSettings.email || '');
    }
  }, [shopSettings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const existing = await db.settings.toCollection().first();
      const settingsData = {
        namaToko,
        logoBase64,
        alamat,
        telepon,
        instagram,
        whatsapp,
        email
      };
      
      // Use put to save or update
      if (existing) {
        await db.settings.put({ ...settingsData, id: existing.id });
      } else {
        await db.settings.put(settingsData);
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset database? Semua produk dan transaksi akan dihapus dan dikembalikan ke data awal.')) {
      try {
        await db.products.clear();
        await db.transactions.clear();
        // Settings are kept, but we could clear them too if needed
        window.location.reload(); // Reload to trigger seedData in App.tsx
      } catch (error) {
        console.error('Failed to reset database:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const products = await db.products.toArray();
      const transactions = await db.transactions.toArray();
      const settings = await db.settings.toArray();
      
      const data = {
        products,
        transactions,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zhuxin-florist-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal mengekspor data.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Mengimpor data akan menghapus semua data saat ini dan menggantinya dengan data dari file. Lanjutkan?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.products || !data.transactions) {
          throw new Error('Format file tidak valid.');
        }

        await db.transaction('rw', db.products, db.transactions, db.settings, async () => {
          await db.products.clear();
          await db.transactions.clear();
          await db.settings.clear();
          
          await db.products.bulkAdd(data.products);
          await db.transactions.bulkAdd(data.transactions);
          if (data.settings && data.settings.length > 0) {
            await db.settings.bulkAdd(data.settings);
          }
        });

        alert('Data berhasil diimpor! Aplikasi akan dimuat ulang.');
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert('Gagal mengimpor data. Pastikan file JSON valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-slate-900">Pengaturan Profil</h2>
        <p className="text-slate-500 font-medium">Kelola identitas brand Zhuxin Florist Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile Photo */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="relative group cursor-pointer mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-rose-50 shadow-xl bg-slate-50 flex items-center justify-center">
                {logoBase64 ? (
                  <img src={logoBase64} alt="Logo Toko" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-300" />
                )}
              </div>
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ubah Foto</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <h3 className="font-black text-slate-900 text-lg">{namaToko || 'Zhuxin Florist'}</h3>
            <p className="text-xs font-black text-rose-600 uppercase tracking-widest mt-1">Admin Utama</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 lg:p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Nama Toko / Brand
                </label>
                <input 
                  type="text" 
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  placeholder="Masukkan nama toko Anda..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telepon Toko
                  </label>
                  <input 
                    type="text" 
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    WhatsApp Order
                  </label>
                  <input 
                    type="text" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Instagram
                  </label>
                  <input 
                    type="text" 
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@username"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4 opacity-0" /> {/* Spacer */}
                    Email Toko
                  </label>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toko@email.com"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Alamat Lengkap
                </label>
                <textarea 
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Bunga Melati No. 123..."
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 resize-none"
                />
              </div>

              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Informasi Penting</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Nama toko ini akan muncul secara otomatis di bagian Header aplikasi dan Struk Belanja pelanggan. Pastikan nama sudah benar sebelum menyimpan.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Berhasil Disimpan!
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={handleSave}
                disabled={isSaving || !namaToko}
                className={cn(
                  "ml-auto flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50",
                  isSaving && "animate-pulse"
                )}
              >
                {isSaving ? 'MENYIMPAN...' : (
                  <>
                    <Save className="w-5 h-5" />
                    SIMPAN PERUBAHAN
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Portability & Danger Zone */}
          <div className="space-y-6">
            {/* Export/Import Section */}
            <div className="bg-white p-8 lg:p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-slate-900">
                <RefreshCw className="w-6 h-6 text-rose-600" />
                <h3 className="font-black text-lg">Portabilitas Data</h3>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Ekspor data Anda ke file JSON untuk dipindahkan ke laptop lain atau sebagai cadangan. Semua gambar produk akan ikut tersimpan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                >
                  <Download className="w-4 h-4" />
                  Ekspor Data (.json)
                </button>
                <label className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Impor Data (.json)
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white p-8 lg:p-10 rounded-[40px] border border-red-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-red-600">
                <Trash2 className="w-6 h-6" />
                <h3 className="font-black text-lg">Zona Bahaya</h3>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Jika produk atau gambar tidak muncul, Anda dapat mereset database ke pengaturan awal. Semua data transaksi akan ikut terhapus.
              </p>
              <button 
                onClick={handleResetDatabase}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Semua Data & Gambar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
