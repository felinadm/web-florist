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
import { Reports } from './pages/Reports';
import { Suppliers } from './pages/Suppliers';
import { Purchases } from './pages/Purchases';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { Login } from './pages/Login';
import { View, Product } from './types';
import { db } from './lib/dexieDb';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('customer');
  
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
      const initialProducts: Product[] = [
        { id: '1', name: 'Buket Mawar Merah Premium', price: 250000, stock: 15, category: 'Buket', imageUrl: 'https://images.unsplash.com/photo-1548610762-7c6abc9d6d6f?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000000 },
        { id: '2', name: 'Bunga Matahari (Sunflower)', price: 45000, stock: 15, category: 'Satuan', imageUrl: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000001 },
        { id: '3', name: 'Anggrek Bulan Putih', price: 250000, stock: 10, category: 'Tanaman Pot', imageUrl: 'https://images.unsplash.com/photo-1599232458812-5883e7d32e6d?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000002 },
        { id: '4', name: 'Buket Tulip Pastel', price: 350000, stock: 5, category: 'Buket', imageUrl: 'https://images.unsplash.com/photo-1523694576729-dc99e2c01707?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000003 },
        { id: '5', name: 'Bunga Lily Casablanca', price: 85000, stock: 12, category: 'Satuan', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000004 },
        { id: '6', name: 'Bunga Papan Ucapan Selamat', price: 750000, stock: 3, category: 'Bunga Papan', imageUrl: 'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000005 },
        { id: '7', name: 'Rangkaian Bunga Meja', price: 450000, stock: 8, category: 'Bunga Meja', imageUrl: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000006 },
        { id: '8', name: 'Buket Hydrangea Biru', price: 275000, stock: 6, category: 'Buket', imageUrl: 'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?auto=format&fit=crop&w=800&q=80', createdAt: 1713190000007 },
      ];

      const SEED_VERSION = 'v52';
      const lastSeed = localStorage.getItem('lastSeedVersion');
      
      if (lastSeed !== SEED_VERSION) {
        // Clear and re-seed to ensure images are updated
        await db.products.clear();
        await db.products.bulkAdd(initialProducts);
        localStorage.setItem('lastSeedVersion', SEED_VERSION);
        console.log(`Database Reset & Seeded to Version ${SEED_VERSION}`);
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
      case 'suppliers': return <Suppliers />;
      case 'purchases': return <Purchases />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'products': return 'Koleksi Bunga';
      case 'pos': return 'Kasir Florist';
      case 'suppliers': return 'Manajemen Supplier';
      case 'purchases': return 'Pembelian Barang';
      case 'history': return 'Riwayat Pesanan';
      case 'reports': return 'Analisis Laporan';
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
