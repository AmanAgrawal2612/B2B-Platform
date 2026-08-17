import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { 
  ShoppingBag, Clock, CheckCircle, Package
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();

  const { data: orders = [], isLoading: loading, error } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const res = await apiClient.get('/api/orders/my-orders');
      return res.data;
    }
  });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your orders...</div>;

  return (
    <div className="space-y-8">
      {/* Outgoing Orders Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-600" /> My Orders
        </h2>
        {orders.length === 0 ? (
          <p className="text-slate-500">You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border border-slate-200 bg-slate-50 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Order #{order.id}</h3>
                    <p className="text-sm text-slate-500">Shop: {order.Shop?.shopName} • Status: {order.status}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
    </div>
  );
};

export default CustomerDashboard;
