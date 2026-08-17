import React from 'react';
import { ShieldCheck, UserX, Power, PowerOff, Trash2 } from 'lucide-react';
import Button from '../../common/Button';

const CustomerTable = ({ connections, onToggleStatus, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full min-w-[700px] text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <th className="p-4 font-semibold">Sr. No.</th>
            <th className="p-4 font-semibold">Name</th>
            <th className="p-4 font-semibold">Email</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {connections.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-8 text-center text-slate-500">
                No customers have connected to your shop yet. Share your Unique Code to get started!
              </td>
            </tr>
          ) : (
            connections.map((conn, index) => (
              <tr key={conn.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${conn.status === 'Blocked' ? 'opacity-60' : ''}`}>
                <td className="p-4 font-medium text-slate-500">{index + 1}</td>
                <td className="p-4 font-medium text-slate-800">{conn.Customer?.name}</td>
                <td className="p-4 text-slate-600">{conn.Customer?.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 ${conn.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {conn.status === 'Active' ? <ShieldCheck className="w-3 h-3"/> : <UserX className="w-3 h-3"/>}
                    {conn.status}
                  </span>
                </td>
                <td className="p-4 flex justify-end gap-2">
                  <Button 
                    variant={conn.status === 'Active' ? 'outline' : 'secondary'}
                    onClick={() => onToggleStatus(conn.id, conn.status)} 
                    className={conn.status === 'Active' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : ''}
                  >
                    {conn.status === 'Active' ? (
                      <><PowerOff className="w-4 h-4" /> Deactivate</>
                    ) : (
                      <><Power className="w-4 h-4" /> Activate</>
                    )}
                  </Button>
                  <Button variant="danger" onClick={() => onDelete(conn.id)}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
