import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { Clock, History } from 'lucide-react';

const ShopOrderHistory = () => {
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['shopOrders'],
    queryFn: async () => {
      const res = await apiClient.get('/api/orders/incoming');
      return res.data;
    }
  });

  if (ordersLoading) return <div className="p-8 text-center text-slate-500">Loading order history...</div>;

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  
  // Only show processed orders that are older than 2 days
  const historyOrders = orders.filter(
    (o) => o.status !== 'Pending' && new Date(o.updatedAt) < twoDaysAgo
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" /> Order History
        </h1>
        <p className="text-slate-500">Archived customer orders that were processed more than 2 days ago.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        {historyOrders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No order history available.</p>
        ) : (
          <div className="space-y-4">
            {historyOrders.map(order => (
              <div key={order.id} className="border border-slate-200 bg-slate-50 p-4 rounded-xl shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Order #{order.id}</h3>
                    <p className="text-sm text-slate-500">
                      Customer ID: {order.customerId} • Processed: {new Date(order.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
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
    </div>
  );
};

export default ShopOrderHistory;
