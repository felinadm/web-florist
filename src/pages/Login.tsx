import React, { useState } from 'react';
import { Lock, User, Flower2, ArrowLeft, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: () => void;
  onBackToStore: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onBackToStore }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());

  const performLogin = (u: string, p: string) => {
    setError('');
    setIsLoading(true);

    // Simulated login logic
    setTimeout(() => {
      if (u === 'admin' && p === 'admin123') {
        setShowSuccess(true);
        setTimeout(() => {
          onLogin();
        }, 1500);
      } else {
        setError('Username atau password salah!');
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, password);
  };

  const handleDemoLogin = () => {
    const u = 'admin';
    const p = 'admin123';
    setUsername(u);
    setPassword(p);
    // Auto trigger login after a short delay to show the fields being filled
    setTimeout(() => {
      performLogin(u, p);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-rose-600 rounded-[32px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-200">
            {shopSettings?.logoBase64 ? (
              <img src={shopSettings.logoBase64} alt="Logo" className="w-full h-full object-cover rounded-[32px]" />
            ) : (
              <Flower2 className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {shopSettings?.namaToko || 'Zhuxin Florist'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">Masuk ke Panel Administrasi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[48px] shadow-2xl shadow-rose-100 border border-rose-50 p-8 lg:p-12 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Login Berhasil!</h2>
                <p className="text-slate-500">Mengarahkan Anda ke Dashboard...</p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-800"
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      MASUK SEKARANG
                    </>
                  )}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-white px-4 text-slate-400">Atau</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-4 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-100 transition-all active:scale-95 border border-rose-100 flex items-center justify-center gap-2"
                >
                  DEMO LOGIN CEPAT
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Back to Store */}
        <button 
          onClick={onBackToStore}
          className="mt-8 mx-auto flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors font-black text-[10px] uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Kembali ke Halaman Store
        </button>
      </motion.div>
    </div>
  );
};
