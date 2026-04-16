/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { ProductManagement } from './pages/ProductManagement';
import { Kasir } from './pages/Kasir';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { Login } from './pages/Login';
import { View, Product } from './types';
import { db } from './lib/dexieDb';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(() => {
    const savedView = localStorage.getItem('currentView');
    return (savedView as View) || 'customer';
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    const seedData = async () => {
      const count = await db.products.count();
      const initialProducts: Product[] = [
        { id: '1', nama: 'Buket Soft Flower', harga: 150000, stok: 20, kategori: 'Buket', urlGambar: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '2', nama: 'Bunga Matahari (Sunflower)', harga: 45000, stok: 15, kategori: 'Satuan', urlGambar: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '3', nama: 'Anggrek Bulan Putih', harga: 250000, stok: 10, kategori: 'Tanaman Pot', urlGambar: 'https://images.unsplash.com/photo-1534885391148-4330f5088a53?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '4', nama: 'Buket Tulip Pastel', harga: 350000, stok: 5, kategori: 'Buket', urlGambar: 'https://images.unsplash.com/photo-1520323232427-6b6230f72e2c?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
        { id: '5', nama: 'Bunga Lily Casablanca', harga: 85000, stok: 12, kategori: 'Satuan', urlGambar: 'https://images.unsplash.com/photo-1519152368339-147bbad9969e?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      ];

      if (count === 0) {
        await db.products.bulkAdd(initialProducts);
      } else {
        // If products exist but might be missing images from old version, update them
        const existingProducts = await db.products.toArray();
        const needsUpdate = existingProducts.some(p => !p.urlGambar);
        if (needsUpdate) {
          for (const p of initialProducts) {
            await db.products.update(p.id, { urlGambar: p.urlGambar });
          }
        }
      }
    };
    seedData();
  }, []);

  if (currentView === 'customer') {
    return (
      <CustomerDashboard 
        onAdminReturn={() => {
          if (isLoggedIn) {
            setCurrentView('dashboard');
          } else {
            setCurrentView('login');
          }
        }} 
      />
    );
  }

  if (currentView === 'login') {
    return (
      <Login 
        onLogin={() => {
          setIsLoggedIn(true);
          setCurrentView('dashboard');
          setNotification({ message: 'Login Berhasil! Selamat datang kembali.', type: 'success' });
          setTimeout(() => setNotification(null), 3000);
        }}
        onBackToStore={() => setCurrentView('customer')}
      />
    );
  }

  // Protected Route Logic
  if (!isLoggedIn) {
    setCurrentView('login');
    return null;
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('login');
    setNotification({ message: 'Anda telah Logout. Sampai jumpa!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <ProductManagement />;
      case 'pos': return <Kasir />;
      case 'history': return <History />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'products': return 'Koleksi Bunga';
      case 'pos': return 'Kasir Florist';
      case 'history': return 'Riwayat Pesanan';
      case 'settings': return 'Pengaturan Profil';
      default: return 'Dashboard';
    }
  };

  return (
    <>
      <MainLayout 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={handleLogout}
        title={getViewTitle()}
      >
        {renderView()}
      </MainLayout>

      {/* Global Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm text-white ${
              notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
