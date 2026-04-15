import React, { useState, useEffect } from 'react';
import { Camera, Save, Store, User, CheckCircle2, AlertCircle } from 'lucide-react';
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
                    <Camera className="w-4 h-4" />
                    Telepon / WhatsApp
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
        </div>
      </div>
    </div>
  );
};
