import React from 'react';
import { CheckSquare, Trash2, Edit2 } from 'lucide-react';
import Button from '../../common/Button';

const ApprovedCatalogTable = ({ items, onDelete, onEdit }) => {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="text-emerald-600" /> Approved Global Catalog
        </h2>
      </div>
      
      <p className="text-slate-500">
        This is the full list of approved Master Items that are globally available for all Shop Owners to add to their inventory.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-4 font-semibold">Item Name</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="2" className="p-8 text-center text-slate-500">
                  The global catalog is currently empty.
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
                      <tr key={`header-${item.id}-${item.category}-${item.subCategory}`} className="bg-slate-100/70 border-b border-slate-200">
                        <td colSpan="2" className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {currentCategory} &gt; {currentSubcategory}
                        </td>
                      </tr>
                    );
                  }
                  
                  rows.push(
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">{item.itemName}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => onEdit(item.id, item.itemName)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50">
                          <Edit2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" onClick={() => onDelete(item.id, true)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-5 h-5" />
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

export default ApprovedCatalogTable;
