import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';

const LowStockWidget = ({ inventory }) => {
  const lowStockItems = inventory.filter(item => item.currentStock <= 10);

  if (lowStockItems.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-red-700 flex items-center gap-2 mb-2">
          <AlertTriangle className="w-6 h-6" /> Low Stock Alert
        </h3>
        <p className="text-sm text-red-600 font-medium">
          You have {lowStockItems.length} items running low in your inventory (10 or fewer remaining). Please restock soon.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1 w-full">
        {lowStockItems.slice(0, 3).map(item => (
          <div key={item.id} className="bg-white rounded-lg p-3 border border-red-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-800 text-sm truncate">{item.MasterItem?.itemName}</div>
              <div className="text-xs text-slate-500 truncate">{item.MasterItem?.category}</div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-red-600 font-bold text-sm bg-red-50 w-fit px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3" />
              {item.currentStock} left
            </div>
          </div>
        ))}
        {lowStockItems.length > 3 && (
          <div className="bg-red-100 rounded-lg p-3 flex items-center justify-center text-red-700 font-bold text-sm shadow-sm cursor-pointer hover:bg-red-200 transition-colors">
            +{lowStockItems.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockWidget;
