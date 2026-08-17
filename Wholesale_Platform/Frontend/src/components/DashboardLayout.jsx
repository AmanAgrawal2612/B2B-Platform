import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../apiClient';
import {
  ArrowLeft, Wand2, Camera, Menu, FileText,
  LogOut, LayoutDashboard, Store, Users, Activity,
  Package, Link as LinkIcon, Database, Shield, ShoppingCart, TrendingUp, History
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, isShopOwner, isCustomer, isAdmin, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [shopCode, setShopCode] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isShopOwner) {
      apiClient.get('/api/shops/my-shop')
        .then(res => {
          if (res.data && res.data.uniqueCode) {
            setShopCode(res.data.uniqueCode);
          }
        })
        .catch(err => console.error('Failed to load shop code', err));
    }
  }, [isShopOwner]);

  // Define menu items based on role
  let menuItems = [];
  if (isShopOwner) {
    menuItems = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Forecasts', path: '/forecasts', icon: TrendingUp },
      { name: 'Inventory', path: '/inventory', icon: Package },
      { name: 'Order History', path: '/order-history', icon: History },
      { name: 'My Suppliers', path: '/suppliers', icon: Store },
      { name: 'My Purchases', path: '/my-purchases', icon: FileText },
      { name: 'Order Products', path: '/order', icon: ShoppingCart },
      { name: 'Network', path: '/network', icon: Users },
    ];
  } else if (isCustomer) {
    menuItems = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Order Products', path: '/order', icon: ShoppingCart },
      { name: 'My Shops', path: '/network', icon: Store },
    ];
  } else if (isAdmin) {
    menuItems = [
      { name: 'Platform Overview', path: '/dashboard', icon: Activity },
      { name: 'Master Catalog', path: '/inventory', icon: Package },
      { name: 'User Management', path: '/users', icon: Users },
      { name: 'System Logs', path: '/logs', icon: Database },
    ];
  } else {
    // Fallback
    menuItems = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ];
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">

      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? 'w-64 px-4' : 'w-0 px-0'
          } bg-white border-r border-slate-200 flex flex-col items-center py-6 shrink-0 transition-all duration-300 overflow-hidden`}
      >

        {/* Profile Area */}
        <div className="relative mb-4 flex flex-col items-center mt-2">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex flex-col items-center justify-start pt-2 relative">
            <span className="text-emerald-500 text-sm font-medium">Profile</span>

            {/* Floating Action Buttons */}
            <div className="absolute -bottom-2 -right-2 flex gap-1 bg-white p-1 rounded-full shadow-sm">
              <button className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <h2 className="mt-4 font-bold text-slate-800 uppercase text-sm tracking-wide flex items-center justify-center flex-wrap gap-2 text-center">
            {user?.name || 'User'}
            {shopCode && (
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] tracking-wider border border-slate-200">
                {shopCode}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</p>
        </div>

        {/* Navigation Items */}
        <nav className="w-full mt-8 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Check if current path exactly matches or is a sub-route (e.g., /order/123)
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">

        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">

          {/* Brand Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-800 leading-tight">WholesaleOS</h1>
                <span className="text-[10px] text-slate-500 tracking-wider font-semibold">AI POWERED | B2B PLATFORM</span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              WELCOME {user?.name || 'User'}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-sm font-bold"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>

        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;
