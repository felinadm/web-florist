import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  X, 
  ShoppingBag, 
  Lock,
  Filter, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ArrowRight,
  Printer,
  Flower2,
  ChevronRight,
  Star,
  Instagram,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Heart,
  Sparkles
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { Product, CartItem, Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerDashboardProps {
  onAdminReturn?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onAdminReturn }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'catalog' | 'checkout' | 'success'>('catalog');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'qris' | 'cash'>('qris');
  const [bloomItem, setBloomItem] = useState<string | null>(null);

  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());
  const products = useLiveQuery(
    () => db.products.toArray(),
    []
  );

  const categories = ['Semua', ...Array.from(new Set(products?.map(p => p.kategori) || []))];

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || p.kategori === selectedCategory;
    return matchesSearch && matchesCategory && p.stok > 0;
  });

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.jumlah + quantity, product.stok);
        return prev.map(item => item.id === product.id ? { ...item, jumlah: newQty } : item);
      }
      return [...prev, { ...product, jumlah: Math.min(quantity, product.stok) }];
    });
    
    setBloomItem(product.id);
    setTimeout(() => setBloomItem(null), 1000);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.jumlah + delta, item.stok));
        return { ...item, jumlah: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.harga * curr.jumlah), 0);
  const cartCount = cart.reduce((acc, curr) => acc + curr.jumlah, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const transaction: Transaction = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      itemDibeli: [...cart],
      totalHarga: cartTotal,
      metodePembayaran: paymentMethod,
      tanggal: Date.now()
    };

    try {
      await db.transactions.put(transaction);
      
      // Update Stock
      for (const item of cart) {
        const product = await db.products.get(item.id);
        if (product) {
          await db.products.update(item.id, {
            stok: product.stok - item.jumlah
          });
        }
      }

      setLastTransaction(transaction);
      setCart([]);
      setCheckoutStep('success');
      setIsCartOpen(false);
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9FA] font-sans text-slate-900 pb-24 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-24 w-[500px] h-[500px] bg-pink-100/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-50/30 rounded-full blur-3xl"
        />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-rose-100 px-4 py-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight">
                {shopSettings?.namaToko || 'Zhuxin Florist'}
              </h1>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Marketplace</p>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-slate-100 rounded-2xl px-4 py-2 w-96 border border-slate-200 focus-within:ring-4 focus-within:ring-rose-500/10 focus-within:border-rose-500 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari bunga impian Anda..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full text-slate-700 placeholder:text-slate-400 outline-none font-medium" 
            />
          </div>

          <div className="flex items-center gap-3">
            {onAdminReturn && (
              <button 
                onClick={onAdminReturn}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-200 group"
              >
                <Lock className="w-3 h-3 transition-transform group-hover:scale-110" />
                Login Admin
              </button>
            )}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-white border border-rose-100 rounded-2xl text-rose-600 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 relative z-10">
        {checkoutStep === 'catalog' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative rounded-[50px] overflow-hidden bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 p-8 lg:p-20 text-white shadow-2xl shadow-rose-200 group">
              <div className="relative z-10 max-w-2xl">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-white/30"
                >
                  <Sparkles className="w-3 h-3" />
                  Koleksi Musim Semi 2024
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl lg:text-7xl font-display font-black leading-[1] mb-8 tracking-tight"
                >
                  Ungkapkan <span className="italic font-serif font-light text-rose-100">Cinta</span> dengan <span className="text-rose-200">Bunga.</span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-rose-50 text-xl font-medium mb-10 opacity-90 leading-relaxed max-w-xl"
                >
                  Pilih dari ratusan koleksi bunga segar pilihan yang dirangkai dengan penuh cinta untuk momen spesial Anda.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-4"
                >
                  <button className="px-10 py-5 bg-white text-rose-600 rounded-[24px] font-black shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2">
                    Lihat Promo
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button className="px-10 py-5 bg-rose-700/20 backdrop-blur-md text-white rounded-[24px] font-black border border-white/30 hover:bg-rose-700/40 transition-all flex items-center gap-2">
                    Tentang Kami
                  </button>
                </motion.div>
              </div>
              
              {/* Floating Flowers in Hero */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block pointer-events-none">
                <motion.div 
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [12, 15, 12]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-10 -bottom-10"
                >
                  <Flower2 className="w-[400px] h-[400px] text-white/10" />
                </motion.div>
                <motion.div 
                  animate={{ 
                    y: [0, 30, 0],
                    rotate: [-10, -5, -10]
                  }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute right-20 top-10"
                >
                  <Flower2 className="w-32 h-32 text-white/20" />
                </motion.div>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/4 top-1/3"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-4 overflow-x-auto pb-6 no-scrollbar">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-8 py-4 rounded-[24px] font-black text-sm whitespace-nowrap transition-all border-2 flex items-center gap-2",
                    selectedCategory === cat 
                      ? "bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-200 scale-105" 
                      : "bg-white border-rose-50 text-slate-500 hover:border-rose-200 hover:bg-rose-50/30"
                  )}
                >
                  {cat === 'Semua' ? <Sparkles className="w-4 h-4" /> : <Flower2 className="w-4 h-4" />}
                  {cat}
                </motion.button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
              <AnimatePresence mode="popLayout">
                {filteredProducts?.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-[40px] border border-rose-50 overflow-hidden hover:shadow-[0_20px_50px_rgba(255,182,193,0.3)] transition-all duration-500 relative"
                  >
                    {/* Bloom Animation Overlay */}
                    <AnimatePresence>
                      {bloomItem === product.id && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                        >
                          <div className="w-32 h-32 bg-rose-500/20 rounded-full blur-xl animate-ping" />
                          <Flower2 className="w-20 h-20 text-rose-500 animate-sway" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div 
                      className="aspect-[4/5] overflow-hidden relative cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.urlGambar ? (
                        <img src={product.urlGambar} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={product.nama} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-200">
                          <Flower2 className="w-20 h-20 animate-sway" />
                        </div>
                      )}
                      
                      {/* Floating Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.stok < 10 && (
                          <span className="px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                            Stok Terbatas
                          </span>
                        )}
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-md text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                          <Heart className="w-2 h-2 fill-current" />
                          Favorit
                        </span>
                      </div>

                      <div className="absolute top-4 right-4">
                        <button className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white transition-all active:scale-90">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-rose-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-full py-4 bg-white text-rose-600 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-50 transition-colors"
                        >
                          Tambah ke Keranjang
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">{product.kategori}</span>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-bold text-slate-400">4.9</span>
                        </div>
                      </div>
                      <h3 className="font-display font-black text-slate-800 text-base lg:text-lg leading-tight group-hover:text-rose-600 transition-colors">{product.nama}</h3>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-rose-600 font-black text-xl">{formatCurrency(product.harga)}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {checkoutStep === 'checkout' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <button 
              onClick={() => setCheckoutStep('catalog')}
              className="flex items-center gap-2 text-slate-400 font-bold hover:text-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
              Kembali Belanja
            </button>

            <div className="bg-white rounded-[40px] border border-rose-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-rose-50 bg-rose-50/30">
                <h2 className="text-2xl font-black text-slate-900">Ringkasan Pesanan</h2>
                <p className="text-slate-500 text-sm">Selesaikan pembayaran Anda untuk memproses pesanan.</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                        {item.urlGambar ? (
                          <img src={item.urlGambar} className="w-full h-full object-cover" alt={item.nama} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Flower2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm">{item.nama}</h4>
                        <p className="text-xs text-slate-400">{item.jumlah} x {formatCurrency(item.harga)}</p>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(item.harga * item.jumlah)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-rose-100 space-y-3">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Biaya Layanan</span>
                    <span>Rp 2.000</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black text-slate-900 pt-4">
                    <span>Total Bayar</span>
                    <span className="text-rose-600">{formatCurrency(cartTotal + 2000)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'qris', label: 'QRIS', icon: CheckCircle2 },
                      { id: 'transfer', label: 'Transfer', icon: ArrowRight },
                      { id: 'cash', label: 'Di Kasir', icon: ShoppingBag },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2",
                          paymentMethod === method.id 
                            ? "border-rose-600 bg-rose-50 text-rose-600 shadow-inner" 
                            : "border-slate-100 bg-white text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        <method.icon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-tight">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full py-5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black rounded-[24px] hover:shadow-2xl hover:shadow-rose-200 transition-all active:scale-[0.98] tracking-widest text-lg mt-8"
                >
                  BAYAR SEKARANG
                </button>
              </div>
            </div>
          </div>
        )}

        {checkoutStep === 'success' && lastTransaction && (
          <div className="max-w-md mx-auto text-center space-y-8 py-12">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100"
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Pesanan Berhasil!</h2>
              <p className="text-slate-500 font-medium">Terima kasih telah berbelanja di {shopSettings?.namaToko || 'Zhuxin Florist'}.</p>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-rose-100 shadow-xl space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
              
              <div className="relative space-y-4">
                <div className="flex justify-between items-center border-b border-rose-50 pb-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ID Pesanan</span>
                  <span className="font-bold text-slate-900">#{lastTransaction.id.slice(0, 8)}</span>
                </div>
                
                <div className="space-y-2">
                  {lastTransaction.itemDibeli.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.jumlah}x {item.nama}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(item.harga * item.jumlah)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-rose-100 flex justify-between items-center">
                  <span className="text-lg font-black text-slate-900">Total</span>
                  <span className="text-2xl font-black text-rose-600">{formatCurrency(lastTransaction.totalHarga)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.print()}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                SIMPAN STRUK
              </button>
              <button 
                onClick={() => setCheckoutStep('catalog')}
                className="w-full py-4 bg-white text-rose-600 border-2 border-rose-100 font-black rounded-2xl hover:bg-rose-50 transition-all"
              >
                KEMBALI KE KATALOG
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100 pt-16 pb-8 px-4 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                <Flower2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {shopSettings?.namaToko || 'Zhuxin Florist'}
              </h3>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Menyediakan berbagai macam bunga segar pilihan untuk setiap momen berharga Anda. Kualitas terbaik dengan pelayanan sepenuh hati.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tautan Cepat</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors">Katalog Produk</a></li>
              <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors">Promo Spesial</a></li>
              <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors">Cara Pemesanan</a></li>
              <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors">Kebijakan Pengembalian</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Hubungi Kami</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-slate-600 leading-relaxed">
                  {shopSettings?.alamat || 'Jl. Bunga Melati No. 123, Jakarta Selatan, DKI Jakarta'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-slate-600">
                  {shopSettings?.telepon || '0812-3456-7890'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-slate-600">
                  {shopSettings?.email || 'halo@zhuxinflorist.com'}
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Berlangganan</h4>
            <p className="text-sm font-medium text-slate-500">Dapatkan info promo dan koleksi bunga terbaru langsung di email Anda.</p>
            <div className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Email Anda..." 
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-sm font-bold"
              />
              <button className="w-full py-3 bg-rose-600 text-white font-black rounded-2xl hover:shadow-lg hover:shadow-rose-200 transition-all">
                DAFTAR SEKARANG
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-rose-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            © 2024 {shopSettings?.namaToko || 'Zhuxin Florist'}. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600">Privacy Policy</a>
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button (Mobile) */}
      {checkoutStep === 'catalog' && cartCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] md:hidden">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black shadow-2xl shadow-rose-300 flex items-center justify-between px-6 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6" />
              <span>{cartCount} Item di Keranjang</span>
            </div>
            <span className="text-lg">{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Side Drawer Cart */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[60] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-xl">Keranjang Saya</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{cartCount} Item Terpilih</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {cart.length > 0 ? cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 group">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                      {item.urlGambar ? (
                        <img src={item.urlGambar} className="w-full h-full object-cover" alt={item.nama} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Flower2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-black text-slate-800 text-sm truncate">{item.nama}</h5>
                      <p className="text-xs font-black text-rose-600 mt-1">{formatCurrency(item.harga)}</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all active:scale-90 shadow-sm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-6 text-center text-slate-800">{item.jumlah}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all active:scale-90 shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                      <ShoppingCart className="w-10 h-10 text-rose-200" />
                    </div>
                    <p className="text-lg font-black text-slate-800">Keranjang Kosong</p>
                    <p className="text-sm text-slate-400 mt-2 text-center">Jelajahi katalog kami dan temukan bunga favorit Anda!</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Belanja</p>
                    <p className="text-3xl font-black text-rose-600">{formatCurrency(cartTotal)}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1 italic">*Belum termasuk biaya layanan</p>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={() => {
                    setCheckoutStep('checkout');
                    setIsCartOpen(false);
                  }}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-[24px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  LANJUT KE CHECKOUT
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-900 shadow-lg hover:bg-rose-600 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative bg-rose-50">
                {selectedProduct.urlGambar ? (
                  <img src={selectedProduct.urlGambar} className="w-full h-full object-cover" alt={selectedProduct.nama} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-200">
                    <Flower2 className="w-32 h-32" />
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col justify-between">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {selectedProduct.kategori}
                      </span>
                      <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Tersedia
                      </span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-display font-black text-slate-900 leading-[1.1]">{selectedProduct.nama}</h2>
                    <div className="flex items-center gap-6">
                      <p className="text-4xl font-black text-rose-600">{formatCurrency(selectedProduct.harga)}</p>
                      <div className="flex items-center gap-2 text-amber-400 bg-amber-50 px-4 py-2 rounded-2xl">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="text-sm font-black text-amber-700">4.9 (120+ Ulasan)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Deskripsi Produk
                    </h4>
                    <p className="text-slate-600 leading-relaxed font-medium text-lg font-serif">
                      Bunga {selectedProduct.nama} segar pilihan yang dipetik langsung dari kebun kami. Memiliki ketahanan yang luar biasa dan aroma yang sangat menenangkan. Cocok untuk menghiasi ruangan atau sebagai hadiah spesial untuk orang tercinta.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <ShoppingBag className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Stok Tersedia</p>
                      <p className="text-sm font-black text-slate-800">{selectedProduct.stok} Unit Ready</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-5 bg-rose-600 text-white font-black rounded-[24px] hover:shadow-2xl hover:shadow-rose-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                  >
                    <Plus className="w-6 h-6" />
                    TAMBAH KE KERANJANG
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Receipt */}
      <div className="hidden print:block fixed inset-0 bg-white z-[200] p-8 font-mono text-[12px]">
        {lastTransaction && (
          <div className="max-w-[300px] mx-auto space-y-6">
            <div className="text-center border-b border-dashed border-slate-400 pb-4">
              <h1 className="text-lg font-bold uppercase">{shopSettings?.namaToko || 'Zhuxin Florist'}</h1>
              <p>Marketplace Online</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>ID:</span>
                <span>#{lastTransaction.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{new Date(lastTransaction.tanggal).toLocaleString()}</span>
              </div>
            </div>
            <div className="border-b border-dashed border-slate-400 pb-2">
              {lastTransaction.itemDibeli.map(item => (
                <div key={item.id} className="flex justify-between py-1">
                  <span>{item.jumlah}x {item.nama}</span>
                  <span>{formatCurrency(item.harga * item.jumlah)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 font-bold">
              <div className="flex justify-between text-lg">
                <span>TOTAL:</span>
                <span>{formatCurrency(lastTransaction.totalHarga)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span>{lastTransaction.metodePembayaran.toUpperCase()}</span>
              </div>
            </div>
            <div className="text-center pt-8 border-t border-dashed border-slate-400">
              <p>Terima kasih telah berbelanja!</p>
              <p>www.zhuxinflorist.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
