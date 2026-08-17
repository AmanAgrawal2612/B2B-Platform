import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Auth from './components/Auth';
import DashboardLayout from './components/DashboardLayout';
import ShopOwnerDashboard from './components/ShopOwnerDashboard';
import ShopInventoryManager from './components/ShopInventoryManager';
import ShopNetworkManager from './components/ShopNetworkManager';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerNetworkManager from './components/CustomerNetworkManager';
import AdminDashboard from './components/AdminDashboard';
import AdminCatalogManager from './components/AdminCatalogManager';
import ShopCatalogViewer from './components/features/ordering/ShopCatalogViewer';
import OrderProducts from './components/OrderProducts';
import ForecastDashboard from './components/features/forecasts/ForecastDashboard';
import ShopOrderHistory from './components/ShopOrderHistory';
import ToastProvider from './components/common/ToastProvider';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Auth />;
};

// Unified Route Components
const UnifiedDashboard = () => {
  const { user } = useAuth();
  if (user.role === 'ShopOwner') return <ShopOwnerDashboard />;
  if (user.role === 'Customer') return <CustomerDashboard />;
  if (user.role === 'Admin') return <AdminDashboard />;
  return null;
};

const UnifiedInventory = () => {
  const { user } = useAuth();
  if (user.role === 'ShopOwner') return <ShopInventoryManager />;
  if (user.role === 'Admin') return <AdminCatalogManager />;
  return <Navigate to="/dashboard" />;
};

const UnifiedNetwork = () => {
  const { user } = useAuth();
  if (user.role === 'ShopOwner') return <ShopNetworkManager />;
  if (user.role === 'Customer') return <CustomerNetworkManager />;
  return <Navigate to="/dashboard" />;
};

const UnifiedSuppliers = () => {
  const { user } = useAuth();
  if (user.role === 'ShopOwner') return <CustomerNetworkManager />;
  return <Navigate to="/dashboard" />;
};

const UnifiedPurchases = () => {
  const { user } = useAuth();
  if (user.role === 'ShopOwner') return <CustomerDashboard />;
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <>
      <ToastProvider />
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<RootRoute />} />
          
          {/* Unified Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['ShopOwner', 'Customer', 'Admin']}>
              <UnifiedDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['ShopOwner', 'Admin']}>
              <UnifiedInventory />
            </ProtectedRoute>
          } />
          
          <Route path="/network" element={
            <ProtectedRoute allowedRoles={['ShopOwner', 'Customer']}>
              <UnifiedNetwork />
            </ProtectedRoute>
          } />

          <Route path="/suppliers" element={
            <ProtectedRoute allowedRoles={['ShopOwner']}>
              <UnifiedSuppliers />
            </ProtectedRoute>
          } />

          <Route path="/my-purchases" element={
            <ProtectedRoute allowedRoles={['ShopOwner']}>
              <UnifiedPurchases />
            </ProtectedRoute>
          } />

          <Route path="/forecasts" element={
            <ProtectedRoute allowedRoles={['ShopOwner']}>
              <ForecastDashboard />
            </ProtectedRoute>
          } />

          <Route path="/order-history" element={
            <ProtectedRoute allowedRoles={['ShopOwner']}>
              <ShopOrderHistory />
            </ProtectedRoute>
          } />

          <Route path="/order" element={
            <ProtectedRoute allowedRoles={['ShopOwner', 'Customer']}>
              <OrderProducts />
            </ProtectedRoute>
          } />

          <Route path="/shop/:uniqueCode" element={
            <ProtectedRoute allowedRoles={['ShopOwner', 'Customer']}>
              <ShopCatalogViewer />
            </ProtectedRoute>
          } />

          {/* Admin-only generic routes */}
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <div className="p-8 text-center text-slate-500">User Management Coming Soon</div>
            </ProtectedRoute>
          } />
          
          <Route path="/logs" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <div className="p-8 text-center text-slate-500">System Logs Coming Soon</div>
            </ProtectedRoute>
          } />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
