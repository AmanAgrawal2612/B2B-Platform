import React from 'react';
import { ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';
import Button from '../../common/Button';

const PendingCatalogTable = ({ items, onApprove, onDelete }) => {
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
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Subcategory</th>
              <th className="p-4 font-semibold">Item Name</th>
              <th className="p-4 font-semibold">Added By (User ID)</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  No pending items! The global catalog is perfectly clean.
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-600">{item.category}</td>
                  <td className="p-4 text-slate-600">{item.subCategory}</td>
                  <td className="p-4 font-medium text-slate-800">{item.itemName}</td>
                  <td className="p-4 text-slate-500">User #{item.addedBy}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => onApprove(item.id)}>
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    <Button variant="danger" onClick={() => onDelete(item.id, false)}>
                      <Trash2 className="w-4 h-4" /> Delete
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

export default PendingCatalogTable;
