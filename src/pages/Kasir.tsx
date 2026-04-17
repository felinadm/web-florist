import React, { useState, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Wallet, 
  Banknote, 
  CheckCircle2,
  Flower2,
  ShoppingBag,
  X,
  Printer,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { Product, CartItem, Transaction } from '../types';
import { formatCurrency, formatNumber, parseNumber, cn, DEFAULT_FLOWER_IMAGE } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Kasir: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Transaction['metodePembayaran']>('cash');
  const [nominalBayar, setNominalBayar] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());
  const lowStockThreshold = shopSettings?.lowStockThreshold || 5;

  // Reactive Products Query
  const allProducts = useLiveQuery(() => db.products.toArray());
  
  const products = allProducts?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch; // Removed p.stock > 0 filter to show out of stock too if needed, or keep it but I'll add the threshold warning
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.jumlah >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      }
      return [...prev, { ...product, jumlah: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.jumlah + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock) return item;
        return { ...item, jumlah: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.jumlah), 0);
  const taxRate = (shopSettings?.ppn || 0) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const bayar = parseNumber(nominalBayar) || 0;
    if (paymentMethod === 'cash' && bayar < total) return;

    const transaction: Transaction = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      itemDibeli: [...cart],
      totalHarga: total,
      nominalBayar: paymentMethod === 'cash' ? bayar : total,
      kembalian: paymentMethod === 'cash' ? bayar - total : 0,
      metodePembayaran: paymentMethod,
      tanggal: Date.now()
    };

    try {
      // Save Transaction
      await db.transactions.put(transaction);
      
      // Update Stock & Log History
      for (const item of cart) {
        const product = await db.products.get(item.id);
        if (product) {
          // 1. Update Stock
          await db.products.update(item.id, {
            stock: product.stock - item.jumlah
          });

          // 2. Log History
          await db.stockHistory.add({
            id: Math.random().toString(36).substring(2, 15),
            productId: item.id,
            type: 'OUT',
            quantity: item.jumlah,
            referenceId: transaction.id,
            note: `Penjualan Kasir (ID #${transaction.id.slice(0, 8)})`,
            timestamp: Date.now()
          });
        }
      }

      setLastTransaction(transaction);
      setCart([]);
      setNominalBayar('');
      setShowReceipt(true);
      setIsMobileCartOpen(false);
      
      // Auto print after small delay for modal animation
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-gray-100 -m-4 lg:-m-8 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row h-full no-print">
        {/* Left Side: Product Selection (65% on Desktop) */}
        <div className="flex-1 lg:flex-[0.65] flex flex-col h-full min-h-0 bg-gray-100">
          {/* Sticky Search Bar */}
          <div className="p-4 lg:p-6 bg-gray-100 sticky top-0 z-10 transition-colors">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari bunga atau kategori..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-24 lg:pb-6 custom-scrollbar">
            {products === undefined ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {products.map((product) => (
                  <motion.button
                    key={product.id}
                    onClick={() => product.stock > 0 && addToCart(product)}
                    disabled={product.stock <= 0}
                    whileTap={product.stock > 0 ? { scale: 0.95 } : {}}
                    className={cn(
                      "bg-white p-3 lg:p-4 rounded-2xl border text-left transition-all group relative overflow-hidden",
                      product.stock > 0 
                        ? "border-slate-200 hover:border-rose-300 hover:shadow-lg" 
                        : "border-slate-100 opacity-60 grayscale cursor-not-allowed"
                    )}
                  >
                    <div className="aspect-square bg-slate-50 rounded-xl mb-2 lg:mb-3 flex items-center justify-center text-slate-300 group-hover:text-rose-200 transition-colors overflow-hidden relative">
                      {product.stock <= 0 ? (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-2">
                           <X className="w-8 h-8 text-white mb-1 opacity-80" />
                           <span className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">Habis</span>
                        </div>
                      ) : product.stock < lowStockThreshold ? (
                        <div className="absolute top-2 right-2 z-10">
                           <span className="bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shadow-sm flex items-center gap-1">
                              <AlertCircle className="w-2 h-2" />
                              Rendah
                           </span>
                        </div>
                      ) : null}
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          className="w-full h-full object-cover" 
                          alt={product.name} 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_FLOWER_IMAGE;
                          }}
                        />
                      ) : (
                        <Flower2 className="w-8 h-8 lg:w-10 h-10" />
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs lg:text-sm truncate mb-0.5 lg:mb-1 transition-colors">{product.name}</h4>
                    <p className="text-rose-600 font-black text-sm lg:text-base mb-1 lg:mb-2 transition-colors">{formatCurrency(product.price)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[60%] transition-colors">{product.category}</span>
                      <span className={cn(
                        "text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors",
                        product.stock > 0 ? "text-slate-500 bg-slate-100" : "text-red-500 bg-red-50"
                      )}>
                        Stok: {product.stock}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium">Bunga tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart (35% on Desktop) - Hidden on Mobile unless toggled */}
        <div className="hidden lg:flex lg:flex-[0.35] flex-col h-full bg-white border-l border-slate-200 shadow-xl transition-colors duration-300">
          <CartContent 
            cart={cart} 
            updateQuantity={updateQuantity} 
            removeFromCart={removeFromCart} 
            subtotal={subtotal} 
            tax={tax} 
            total={total} 
            paymentMethod={paymentMethod} 
            setPaymentMethod={setPaymentMethod} 
            nominalBayar={nominalBayar}
            setNominalBayar={setNominalBayar}
            handleCheckout={handleCheckout} 
          />
        </div>

        {/* Mobile Floating Cart Button */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%]">
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black shadow-2xl shadow-rose-300 flex items-center justify-between px-6 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-rose-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-rose-600">
                  {cart.reduce((acc, curr) => acc + curr.jumlah, 0)}
                </span>
              </div>
              <span>Lihat Keranjang</span>
            </div>
            <span className="text-lg">{formatCurrency(total)}</span>
          </button>
        </div>

        {/* Mobile Bottom Sheet Cart */}
        <AnimatePresence>
          {isMobileCartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileCartOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[60] h-[85vh] flex flex-col lg:hidden shadow-2xl transition-colors duration-300"
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
                <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
                  <h3 className="font-black text-slate-900 text-lg transition-colors">Keranjang Belanja</h3>
                  <button onClick={() => setIsMobileCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CartContent 
                    cart={cart} 
                    updateQuantity={updateQuantity} 
                    removeFromCart={removeFromCart} 
                    subtotal={subtotal} 
                    tax={tax} 
                    total={total} 
                    paymentMethod={paymentMethod} 
                    setPaymentMethod={setPaymentMethod} 
                    nominalBayar={nominalBayar}
                    setNominalBayar={setNominalBayar}
                    handleCheckout={handleCheckout} 
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastTransaction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md no-print"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white p-6 lg:p-8 rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden transition-colors duration-300"
            >
              <div className="no-print">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 text-center mb-6">Transaksi Berhasil!</h2>
              </div>

              {/* Receipt Content (Printable) */}
              <div ref={receiptRef} className="bg-white p-4 border border-slate-200 rounded-xl font-mono text-[10px] leading-tight text-slate-800 transition-colors">
                <ReceiptTicket transaction={lastTransaction} />
              </div>

              <div className="mt-8 flex flex-col gap-3 no-print">
                <button 
                  onClick={handlePrint}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Ulang Struk
                </button>
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Only Receipt (Hidden in UI) */}
      <div className="print-only font-mono text-[12px] p-8 w-[80mm] mx-auto bg-white">
        {lastTransaction && <ReceiptTicket transaction={lastTransaction} />}
      </div>
    </div>
  );
};

const ReceiptTicket: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());
  const calculatedSubtotal = transaction.itemDibeli.reduce((acc, item) => acc + (item.price * item.jumlah), 0);
  const taxAmount = transaction.totalHarga - calculatedSubtotal;
  
  return (
    <div className="max-w-[300px] mx-auto text-slate-900">
      <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-4">
        <h4 className="font-black text-base uppercase">{shopSettings?.namaToko || 'Zhuxin Florist'}</h4>
        <p className="text-[10px]">{shopSettings?.alamat || 'Jl. Bunga Melati No. 123, Jakarta'}</p>
        <p className="text-[10px]">Telp: {shopSettings?.telepon || '085878263582'}</p>
      </div>
      
      <div className="space-y-1 mb-4 text-[10px]">
        <div className="flex justify-between">
          <span>ID: #{transaction.id.slice(0, 8)}</span>
          <span>{new Date(transaction.tanggal).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>Admin Zhuxin</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu:</span>
          <span>{new Date(transaction.tanggal).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px]">
            {transaction.itemDibeli.map((item) => (
          <div key={item.id} className="mb-2">
            <div className="flex justify-between">
              <span className="flex-1 pr-2">{item.name}</span>
              <span>{(item.price * item.jumlah).toLocaleString()}</span>
            </div>
            <div className="text-slate-500">
              {item.jumlah} x {item.price.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{calculatedSubtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Pajak ({shopSettings?.ppn || 0}%):</span>
          <span>{taxAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-black text-sm pt-2 border-t border-dashed border-slate-400 mt-2">
          <span>TOTAL:</span>
          <span>{transaction.totalHarga.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-1">
          <span>Bayar ({transaction.metodePembayaran.toUpperCase()}):</span>
          <span>{transaction.nominalBayar?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Kembalian:</span>
          <span>{transaction.kembalian?.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-8 text-center border-t border-dashed border-slate-400 pt-4 text-[10px]">
        <p className="font-bold">Terima Kasih</p>
        <p>Bunga Segar, Hati Senang</p>
        <p className="mt-2 italic">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
      </div>
    </div>
  );
};

interface CartContentProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: Transaction['metodePembayaran'];
  setPaymentMethod: (method: Transaction['metodePembayaran']) => void;
  nominalBayar: string;
  setNominalBayar: (val: string) => void;
  handleCheckout: () => void;
}

const CartContent: React.FC<CartContentProps> = ({ 
  cart, updateQuantity, removeFromCart, subtotal, tax, total, paymentMethod, setPaymentMethod, nominalBayar, setNominalBayar, handleCheckout 
}) => (
  <div className="flex flex-col h-full transition-colors duration-300">
    <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 hidden lg:flex transition-colors">
      <div>
        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2 transition-colors">
          <ShoppingCart className="w-6 h-6 text-rose-600" />
          Keranjang
        </h3>
        <p className="text-xs text-slate-500 font-medium transition-colors">Zhuxin Florist Order</p>
      </div>
      <span className="bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-200 transition-colors">
        {cart.reduce((acc, curr) => acc + curr.jumlah, 0)} Item
      </span>
    </div>

    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar transition-colors">
      <AnimatePresence mode="popLayout">
        {cart.length > 0 ? cart.map((item) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-4 group"
          >
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100 transition-colors">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt={item.name} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_FLOWER_IMAGE;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Flower2 className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-slate-800 text-xs lg:text-sm truncate transition-colors">{item.name}</h5>
              <p className="text-[10px] lg:text-xs font-bold text-rose-600 transition-colors">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 transition-colors">
              <button 
                onClick={() => updateQuantity(item.id, -1)}
                className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all active:scale-90 shadow-sm transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-black w-6 text-center text-slate-800 transition-colors">{item.jumlah}</span>
              <button 
                onClick={() => updateQuantity(item.id, 1)}
                className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all active:scale-90 shadow-sm transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button 
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all transition-colors"
            >
              <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </motion.div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 transition-colors">
              <ShoppingCart className="w-8 h-8 lg:w-10 lg:h-10 opacity-10" />
            </div>
            <p className="text-sm font-bold">Keranjang masih kosong</p>
            <p className="text-xs mt-1">Pilih bunga cantik untuk memulai</p>
          </div>
        )}
      </AnimatePresence>
    </div>

    <div className="p-6 lg:p-8 bg-slate-50 border-t border-slate-100 space-y-6 transition-colors duration-300">
      <div className="space-y-3">
        <div className="flex justify-between text-xs lg:text-sm font-medium text-slate-500 transition-colors">
          <span>Subtotal</span>
          <span className="text-slate-800 transition-colors">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs lg:text-sm font-medium text-slate-500 transition-colors">
          <span>Pajak (10%)</span>
          <span className="text-slate-800 transition-colors">{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-xl lg:text-2xl font-black text-slate-900 pt-4 border-t border-slate-200 transition-colors">
          <span>Total</span>
          <span className="text-rose-600 transition-colors">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {[
          { id: 'cash', icon: Banknote, label: 'Tunai' },
          { id: 'qris', icon: Wallet, label: 'QRIS' },
          { id: 'transfer', icon: CreditCard, label: 'Bank' },
        ].map((method) => (
          <button
            key={method.id}
            onClick={() => setPaymentMethod(method.id as any)}
            className={cn(
              "flex flex-col items-center justify-center p-2 lg:p-3 rounded-2xl border-2 transition-all gap-1 transition-colors",
              paymentMethod === method.id 
                ? "border-rose-600 bg-rose-50 text-rose-600 shadow-inner" 
                : "border-slate-100 bg-white text-slate-400 hover:bg-slate-50"
            )}
          >
            <method.icon className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
          </button>
        ))}
      </div>

      {paymentMethod === 'cash' && (
        <div className="space-y-2">
          <label htmlFor="cash-payment" className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors">Nominal Bayar</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
            <input 
              id="cash-payment"
              name="nominalBayar"
              type="text" 
              value={nominalBayar}
              onChange={(e) => {
                const val = parseNumber(e.target.value);
                setNominalBayar(val === 0 ? '' : formatNumber(val));
              }}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-black text-slate-800 placeholder:text-slate-400 transition-colors"
            />
          </div>
          {parseNumber(nominalBayar) >= total && (
            <div className="flex justify-between text-xs font-bold text-emerald-600 transition-colors">
              <span>Kembalian</span>
              <span>{formatCurrency(parseNumber(nominalBayar) - total)}</span>
            </div>
          )}
        </div>
      )}

      <button 
        disabled={cart.length === 0 || (paymentMethod === 'cash' && (parseNumber(nominalBayar) < total || !nominalBayar))}
        onClick={handleCheckout}
        className="w-full py-4 lg:py-5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black rounded-[20px] lg:rounded-[24px] hover:shadow-2xl hover:shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] tracking-widest text-sm lg:text-base transition-colors"
      >
        PROSES PEMBAYARAN
      </button>
    </div>
  </div>
);
