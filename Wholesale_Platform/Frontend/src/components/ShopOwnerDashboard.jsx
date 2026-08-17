import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from './DashboardLayout';

const ShopOwnerDashboard = () => {
  const { user } = useAuth();

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['myShop'],
    queryFn: async () => {
      const res = await apiClient.get('/api/shops/my-shop');
      return res.data;
    }
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['shopOrders'],
    queryFn: async () => {
      const res = await apiClient.get('/api/orders/incoming');
      return res.data;
    }
  });

  if (shopLoading || ordersLoading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const recentOrders = orders.filter(
    (o) => o.status === 'Pending' || new Date(o.updatedAt) >= twoDaysAgo
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Incoming Customer Orders</h2>
      </div>
      
      {recentOrders.length === 0 ? (
        <p className="text-slate-500">No incoming or recent orders.</p>
      ) : (
        <div className="space-y-4">
          {recentOrders.map(order => (
            <div key={order.id} className="border border-slate-200 bg-slate-50 p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Order #{order.id}</h3>
                  <p className="text-sm text-slate-500">Customer ID: {order.customerId} • Status: {order.status}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'Pending' ? 'bg-amber-100 text-amber-700' 
                  : order.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-red-100 text-red-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Items:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {order.OrderItems?.map(item => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.Inventory?.MasterItem?.itemName} (x{item.quantity})</span>
                      <span>₹{parseFloat(item.priceAtTimeOfOrder).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopOwnerDashboard;
