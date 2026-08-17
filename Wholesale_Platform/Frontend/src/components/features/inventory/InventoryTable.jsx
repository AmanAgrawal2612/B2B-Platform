import React from 'react';
import { Clock, Trash2, Edit2 } from 'lucide-react';

const InventoryTable = ({ inventory, onDelete, onEdit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <th className="p-4 font-semibold">Category</th>
            <th className="p-4 font-semibold">Subcategory</th>
            <th className="p-4 font-semibold">Item Name</th>
            <th className="p-4 font-semibold">Price</th>
            <th className="p-4 font-semibold">Stock</th>
            <th className="p-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-8 text-center text-slate-500">
                Your inventory is empty. Click "Add Item" to start!
              </td>
            </tr>
          ) : (
            inventory.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-slate-600">{item.MasterItem?.Category?.name}</td>
                <td className="p-4 text-slate-600">{item.MasterItem?.SubCategory?.name}</td>
                <td className="p-4 font-medium text-slate-800">{item.MasterItem?.itemName}</td>
                <td className="p-4 font-medium text-emerald-600">₹{parseFloat(item.price).toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.currentStock > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {item.currentStock} in stock
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 p-2 mr-2">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
