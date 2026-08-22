import React from 'react';
import { ShieldAlert, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import Button from '../../common/Button';

const PendingCatalogTable = ({ items, onApprove, onDelete, onEdit }) => {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="text-amber-500" /> Pending Master Catalog Items
        </h2>
      </div>
      
      <p className="text-slate-500">
        These items were created by Shop Owners because they couldn't find them in the global catalog. 
        Review them for typos and approve them to make them globally visible.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-amber-50 border-b border-amber-200 text-amber-900">
              <th className="p-4 font-semibold">Item Name</th>
              <th className="p-4 font-semibold">Added By (User ID)</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-500">
                  No pending items! The global catalog is perfectly clean.
                </td>
              </tr>
            ) : (
              (() => {
                const sortedItems = [...items].sort((a, b) => {
                  const catA = a.category || '';
                  const catB = b.category || '';
                  if (catA !== catB) return catA.localeCompare(catB);
                  
                  const subA = a.subCategory || '';
                  const subB = b.subCategory || '';
                  if (subA !== subB) return subA.localeCompare(subB);
                  
                  const nameA = a.itemName || '';
                  const nameB = b.itemName || '';
                  return nameA.localeCompare(nameB);
                });

                let currentCategory = null;
                let currentSubcategory = null;
                const rows = [];
                
                sortedItems.forEach(item => {
                  if (item.category !== currentCategory || item.subCategory !== currentSubcategory) {
                    currentCategory = item.category;
                    currentSubcategory = item.subCategory;
                    rows.push(
                      <tr key={`header-${item.id}-${item.category}-${item.subCategory}`} className="bg-amber-50/50 border-b border-amber-100">
                        <td colSpan="3" className="px-4 py-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                          {currentCategory} &gt; {currentSubcategory}
                        </td>
                      </tr>
                    );
                  }
                  
                  rows.push(
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">{item.itemName}</td>
                      <td className="p-4 text-slate-500">User #{item.addedBy}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onEdit(item.id, item.itemName)}>
                          <Edit2 className="w-4 h-4" /> Edit
                        </Button>
                        <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => onApprove(item.id)}>
                          <CheckCircle className="w-4 h-4" /> Approve
                        </Button>
                        <Button variant="danger" onClick={() => onDelete(item.id, false)}>
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
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
    </section>
  );
};

export default PendingCatalogTable;
