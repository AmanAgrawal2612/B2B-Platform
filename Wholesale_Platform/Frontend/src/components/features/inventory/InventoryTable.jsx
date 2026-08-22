import React from 'react';
import { Clock, Trash2, Edit2 } from 'lucide-react';

const InventoryTable = ({ inventory, onDelete, onEdit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <th className="p-4 font-semibold">Item Name</th>
            <th className="p-4 font-semibold">Price</th>
            <th className="p-4 font-semibold">Stock</th>
            <th className="p-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-8 text-center text-slate-500">
                Your inventory is empty. Click "Add Item" to start!
              </td>
            </tr>
          ) : (
            (() => {
              const sortedInventory = [...inventory].sort((a, b) => {
                const catA = a.MasterItem?.Category?.name || '';
                const catB = b.MasterItem?.Category?.name || '';
                if (catA !== catB) return catA.localeCompare(catB);
                
                const subA = a.MasterItem?.SubCategory?.name || '';
                const subB = b.MasterItem?.SubCategory?.name || '';
                if (subA !== subB) return subA.localeCompare(subB);
                
                const nameA = a.MasterItem?.itemName || '';
                const nameB = b.MasterItem?.itemName || '';
                return nameA.localeCompare(nameB);
              });

              let currentCategory = null;
              let currentSubcategory = null;
              const rows = [];
              
              sortedInventory.forEach(item => {
                const catName = item.MasterItem?.Category?.name || 'Uncategorized';
                const subCatName = item.MasterItem?.SubCategory?.name || 'No Subcategory';
                
                if (catName !== currentCategory || subCatName !== currentSubcategory) {
                  currentCategory = catName;
                  currentSubcategory = subCatName;
                  rows.push(
                    <tr key={`header-${item.id}-${catName}-${subCatName}`} className="bg-slate-100/70 border-b border-slate-200">
                      <td colSpan="4" className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {currentCategory} &gt; {currentSubcategory}
                      </td>
                    </tr>
                  );
                }
                
                rows.push(
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
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
                );
              });
              
              return rows;
            })()
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
