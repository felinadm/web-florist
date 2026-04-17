import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Save, 
  Store, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Download, 
  Upload, 
  Phone, 
  BarChart3, 
  X,
  CreditCard,
  Database,
  Settings2,
  DollarSign,
  Percent,
  Mail,
  MapPin,
  Instagram
} from 'lucide-react';
import { db } from '../lib/dexieDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatNumber, parseNumber } from '../lib/utils';
import { ShopSettings } from '../types';

type SettingTab = 'profile' | 'finance' | 'system';

export const Settings: React.FC = () => {
  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
  
  // Tab 1: Profile
  const [namaToko, setNamaToko] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Tab 2: Finance
  const [marginType, setMarginType] = useState<'percentage' | 'nominal'>('percentage');
  const [marginValue, setMarginValue] = useState<string>('20');
  const [ppn, setPpn] = useState<string>('0');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');

  // Common
  const [isSaving, setIsSaving] = useState(false);
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (shopSettings) {
      setNamaToko(shopSettings.namaToko);
      setLogoBase64(shopSettings.logoBase64);
      setAlamat(shopSettings.alamat || '');
      setTelepon(shopSettings.telepon || '');
      setInstagram(shopSettings.instagram || '');
      setWhatsapp(shopSettings.whatsapp || '');
      setEmail(shopSettings.email || '');
      setMarginType(shopSettings.marginType || 'percentage');
      setMarginValue(String(shopSettings.marginValue || 20));
      setPpn(String(shopSettings.ppn || 0));
      setLowStockThreshold(String(shopSettings.lowStockThreshold || 5));
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
      const settingsData: Partial<ShopSettings> = {
        namaToko,
        logoBase64,
        alamat,
        telepon,
        instagram,
        whatsapp,
        email,
        marginType,
        marginValue: Number(marginValue) || 0,
        ppn: Number(ppn) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5
      };
      if (existing) {
        await db.settings.put({ ...existing, ...settingsData });
      } else {
        await db.settings.put(settingsData as ShopSettings);
      }
      setShowNotification({ message: 'Pengaturan berhasil disimpan!', type: 'success' });
      setTimeout(() => setShowNotification(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setShowNotification({ message: 'Gagal menyimpan pengaturan.', type: 'error' });
      setTimeout(() => setShowNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset database? Semua produk, transaksi, supplier, dan pembelian akan dihapus dan dikembalikan ke data awal.')) {
      try {
        await db.transaction('rw', [db.products, db.transactions, db.suppliers, db.purchases], async () => {
          await db.products.clear();
          await db.transactions.clear();
          await db.suppliers.clear();
          await db.purchases.clear();
        });
        window.location.reload(); 
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
      const suppliers = await db.suppliers.toArray();
      const purchases = await db.purchases.toArray();
      
      const data = {
        products,
        transactions,
        settings,
        suppliers,
        purchases,
        exportDate: new Date().toISOString(),
        version: '1.6' 
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zhuxin-florist-full-data-${new Date().toISOString().split('T')[0]}.json`;
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

        await db.transaction('rw', [db.products, db.transactions, db.settings, db.suppliers, db.purchases], async () => {
          await db.products.clear();
          await db.transactions.clear();
          await db.settings.clear();
          await db.suppliers.clear();
          await db.purchases.clear();
          
          await db.products.bulkAdd(data.products);
          await db.transactions.bulkAdd(data.transactions);
          if (data.suppliers && data.suppliers.length > 0) {
            await db.suppliers.bulkAdd(data.suppliers);
          }
          if (data.purchases && data.purchases.length > 0) {
            await db.purchases.bulkAdd(data.purchases);
          }
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

  const tabs = [
    { id: 'profile', label: 'Profil Toko', icon: Store },
    { id: 'finance', label: 'Keuangan & Harga', icon: BarChart3 },
    { id: 'system', label: 'Sistem & Data', icon: Settings2 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 transition-colors tracking-tight">Pengaturan Aplikasi</h2>
        <p className="text-slate-500 font-medium transition-colors">Sesuaikan identitas, harga, dan manajemen data Zhuxin Florist.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[28px] border border-slate-200 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingTab)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all relative overflow-hidden",
                isActive 
                  ? "bg-white text-rose-600 shadow-sm border border-rose-100" 
                  : "text-slate-500 hover:text-rose-500 hover:bg-white/50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-rose-600" : "text-slate-400")} />
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-rose-500/5 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center text-center transition-colors">
                  <div className="relative group cursor-pointer mb-8">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-rose-50 shadow-2xl bg-slate-50 flex items-center justify-center transition-colors">
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Logo Toko" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-20 h-20 text-slate-300" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Logo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight transition-colors">{namaToko || 'Zhuxin Florist'}</h3>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] mt-2 transition-colors">Profil Bisnis</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 lg:p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 transition-colors">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="shop-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-colors px-1">
                        <Store className="w-3.5 h-3.5" />
                        Nama Brand Toko
                      </label>
                      <input 
                        id="shop-name"
                        name="namaToko"
                        type="text" 
                        value={namaToko}
                        onChange={(e) => setNamaToko(e.target.value)}
                        placeholder="Contoh: Zhuxin Florist Jakarta"
                        className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label htmlFor="shop-phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-colors px-1">
                          <Phone className="w-3.5 h-3.5" />
                          No. Telepon Aktif
                        </label>
                        <div className="relative">
                          <input 
                            id="shop-phone"
                            name="telepon"
                            type="text" 
                            value={telepon}
                            onChange={(e) => setTelepon(e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label htmlFor="shop-whatsapp" className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 transition-colors px-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Instan WhatsApp
                        </label>
                        <input 
                          id="shop-whatsapp"
                          name="whatsapp"
                          type="text" 
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="628xxxxxxxxxx"
                          className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label htmlFor="shop-instagram" className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 transition-colors px-1">
                          <Instagram className="w-3.5 h-3.5" />
                          Username Instagram
                        </label>
                        <input 
                          id="shop-instagram"
                          name="instagram"
                          type="text" 
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@zhuxin.florist"
                          className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <label htmlFor="shop-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-colors px-1">
                          <Mail className="w-3.5 h-3.5" />
                          Email Korespondensi
                        </label>
                        <input 
                          id="shop-email"
                          name="email"
                          type="text" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="shop@zhuxin.com"
                          className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="shop-address" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-colors px-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Alamat Operasional
                      </label>
                      <textarea 
                        id="shop-address"
                        name="alamat"
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        placeholder="Jl. Toko Bunga No. 88, Central Jakarta..."
                        rows={3}
                        className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800 resize-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving || !namaToko}
                      className={cn(
                        "flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50",
                        isSaving && "animate-pulse"
                      )}
                    >
                      <Save className="w-5 h-5" />
                      {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-10 transition-colors">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Margin Section */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg tracking-tight">Strategi Margin Otomatis</h4>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Sistem Perhitungan Harga</p>
                      </div>
                    </div>

                    <div className="space-y-6 bg-rose-50/50 p-8 rounded-[32px] border border-rose-100">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1">Tipe Margin Default</label>
                        <div className="flex bg-white p-1.5 rounded-[22px] border border-rose-200 shadow-sm">
                          <button 
                            onClick={() => setMarginType('percentage')}
                            className={cn(
                              "flex-1 py-4 rounded-[18px] text-[10px] font-black transition-all flex items-center justify-center gap-2 tracking-widest",
                              marginType === 'percentage' ? "bg-rose-600 text-white shadow-xl shadow-rose-200" : "text-rose-300 hover:text-rose-600"
                            )}
                          >
                            <Percent className="w-3.5 h-3.5" />
                            PERSENTASE (%)
                          </button>
                          <button 
                            onClick={() => setMarginType('nominal')}
                            className={cn(
                              "flex-1 py-4 rounded-[18px] text-[10px] font-black transition-all flex items-center justify-center gap-2 tracking-widest",
                              marginType === 'nominal' ? "bg-rose-600 text-white shadow-xl shadow-rose-200" : "text-rose-300 hover:text-rose-600"
                            )}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            NOMINAL (RP)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label htmlFor="margin-value" className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1">Besaran Nilai Margin</label>
                        <div className="relative">
                          <input 
                            id="margin-value"
                            name="marginValue"
                            type="text" 
                            value={marginValue}
                            onChange={(e) => setMarginValue(formatNumber(parseNumber(e.target.value)))}
                            className="w-full px-8 py-5 bg-white border-2 border-rose-100 rounded-[24px] focus:ring-8 focus:ring-rose-500/5 focus:border-rose-400 outline-none transition-all font-black text-xl text-slate-800"
                            placeholder="0"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-black text-rose-600">
                            {marginType === 'percentage' ? '%' : 'Rp'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tax Section */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg tracking-tight">Kebijakan Pajak & PPN</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pengaturan Transaksi</p>
                      </div>
                    </div>

                    <div className="space-y-6 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                      <div className="space-y-4">
                        <label htmlFor="tax-ppn" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tarif Pajak (PPN %)</label>
                        <div className="relative">
                          <input 
                            id="tax-ppn"
                            name="ppn"
                            type="text" 
                            value={ppn}
                            onChange={(e) => setPpn(formatNumber(parseNumber(e.target.value)))}
                            className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[24px] focus:ring-8 focus:ring-slate-500/5 focus:border-slate-400 outline-none transition-all font-black text-xl text-slate-800"
                            placeholder="0"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600">
                            %
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label htmlFor="low-stock-threshold" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ambang Batas Stok Minimum</label>
                        <div className="relative">
                          <input 
                            id="low-stock-threshold"
                            name="lowStockThreshold"
                            type="text" 
                            value={lowStockThreshold}
                            onChange={(e) => setLowStockThreshold(formatNumber(parseNumber(e.target.value)))}
                            className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[24px] focus:ring-8 focus:ring-slate-500/5 focus:border-slate-400 outline-none transition-all font-black text-xl text-slate-800"
                            placeholder="5"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600 font-mono">
                            #
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium px-1">
                          Sistem akan memberikan peringatan jika stok produk berada di bawah nilai ini.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                      <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        Rumus margin otomatis akan diterapkan seketika pada menu Kelola Produk saat Anda memasukkan Harga Beli.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-3 px-10 py-5 bg-rose-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-rose-100"
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Keuangan'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Portability */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 transition-colors flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg tracking-tight">Manajemen Database</h4>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Ekspor & Impor Data</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Amankan data Anda dengan melakukan backup berkala. Anda bisa mengekspor seluruh basis data ke dalam file JSON yang dapat dipulihkan kapan saja.
                  </p>

                  <div className="grid grid-cols-1 gap-4 mt-auto">
                    <button 
                      onClick={handleExport}
                      className="flex items-center justify-center gap-3 px-8 py-5 bg-emerald-50 text-emerald-600 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                    >
                      <Download className="w-5 h-5" />
                      Backup Database (.json)
                    </button>
                    <label className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-50 text-slate-600 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100 cursor-pointer shadow-sm">
                      <Upload className="w-5 h-5" />
                      Restore Database (.json)
                      <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Reset Section */}
                <div className="bg-white p-10 rounded-[40px] border border-red-100 shadow-sm space-y-8 transition-colors flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-red-900 text-lg tracking-tight text-red-600">Zona Pembersihan</h4>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Data Reset</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Gunakan fitur ini hanya jika Anda ingin memulai dari nol. Tindakan ini akan menghapus seluruh Produk, Supplier, dan Riwayat Penjualan Anda secara permanen.
                  </p>

                  <button 
                    onClick={handleResetDatabase}
                    className="mt-auto flex items-center justify-center gap-3 px-8 py-5 bg-red-50 text-red-600 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset Semua Data (Factory Reset)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
              showNotification.type === 'error' && "bg-red-600/90 border-red-400 shadow-red-200"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {showNotification.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {showNotification.type === 'error' && <X className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="uppercase tracking-widest text-[10px] opacity-80 mb-0.5">
                {showNotification.type === 'success' ? 'Berhasil' : 'Gagal'}
              </p>
              <p className="leading-tight">{showNotification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
