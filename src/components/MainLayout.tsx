import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Menu, 
  X, 
  Flower2, 
  Bell, 
  Search, 
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { View } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/dexieDb';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  title: string;
}

const ADMIN_AVATAR = "https://raw.githubusercontent.com/Ais-Build/assets/main/zhuxin-avatar.png"; // Placeholder path, user should upload to public/admin-avatar.png

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onViewChange, onLogout, title }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shopSettings = useLiveQuery(() => db.settings.toCollection().first());

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Kelola Produk', icon: Package },
    { id: 'pos', label: 'Kasir / PoS', icon: ShoppingCart },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        {shopSettings?.logoBase64 ? (
          <img src={shopSettings.logoBase64} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <Flower2 className="w-8 h-8 text-rose-400 shrink-0" />
        )}
        <span className="ml-3 font-bold text-white text-lg tracking-tight truncate">
          {shopSettings?.namaToko || 'Zhuxin Florist'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              <span className="ml-3 font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-800 shrink-0 space-y-4">
        <button 
          onClick={() => onViewChange('customer')}
          className="w-full text-center py-2 text-xs font-black text-rose-400 uppercase tracking-widest hover:text-rose-300 transition-colors underline underline-offset-4"
        >
          Masuk ke Halaman Customer
        </button>

        <button 
          onClick={onLogout}
          className="w-full flex items-center p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
          <span className="ml-3 font-bold text-xs uppercase tracking-widest">Logout Admin</span>
        </button>

        <button 
          onClick={() => onViewChange('settings')}
          className="w-full flex items-center p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-left group"
        >
          <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden relative">
            <img src="/admin-avatar.png" alt="Admin Avatar" className="w-full h-full object-cover" onError={(e) => {
              (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Zhuxin";
            }} />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{shopSettings?.namaToko || 'Zhuxin Florist'}</p>
            <p className="text-xs text-slate-400 truncate">Admin Toko</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop Overlay */}
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Drawer Content */}
        <aside className={cn(
          "absolute top-0 left-0 h-full w-72 bg-slate-900 transition-transform duration-300 ease-in-out shadow-2xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent />
          
          {/* Close Button for Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 -right-12 p-2 bg-white rounded-full text-slate-900 shadow-lg lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 lg:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
              <div className="hidden lg:block h-4 w-[1px] bg-slate-200"></div>
              <p className="hidden lg:block text-xs font-black text-rose-600 uppercase tracking-widest">
                {shopSettings?.namaToko || 'Zhuxin Florist'}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari sesuatu..." 
                className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-48 lg:w-64 text-slate-700 placeholder:text-slate-400 outline-none font-medium" 
              />
            </div>

            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

            <button 
              onClick={() => onViewChange('settings')}
              className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-full transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 overflow-hidden border border-rose-200">
                <img src="/admin-avatar.png" alt="Admin Profile" className="w-full h-full object-cover" onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Zhuxin";
                }} />
              </div>
              <span className="hidden sm:block text-xs font-black text-slate-700 group-hover:text-rose-600 transition-colors uppercase tracking-tight">
                {shopSettings?.namaToko || 'Admin'}
              </span>
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
