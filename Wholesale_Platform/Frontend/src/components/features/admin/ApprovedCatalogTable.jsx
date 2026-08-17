import React from 'react';
import { CheckSquare, Trash2 } from 'lucide-react';
import Button from '../../common/Button';

const ApprovedCatalogTable = ({ items, onDelete }) => {
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
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Subcategory</th>
              <th className="p-4 font-semibold">Item Name</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">
                  The global catalog is currently empty.
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-600">{item.category}</td>
                  <td className="p-4 text-slate-600">{item.subCategory}</td>
                  <td className="p-4 font-medium text-slate-800">{item.itemName}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onDelete(item.id, true)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ApprovedCatalogTable;
