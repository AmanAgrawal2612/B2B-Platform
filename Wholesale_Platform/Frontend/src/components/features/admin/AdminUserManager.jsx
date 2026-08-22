import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import apiClient from '../../../apiClient';
import { addNotification } from '../../../store/notificationSlice';
import { Users, Store, User, Search, Copy, CheckCircle, XCircle, Trash2, ShieldBan, ShieldCheck } from 'lucide-react';

const AdminUserManager = () => {
  const [activeTab, setActiveTab] = useState('ShopOwner');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await apiClient.get('/api/admin/users');
      return res.data;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await apiClient.put(`/api/admin/users/${userId}/status`);
      return res.data;
    },
    onSuccess: (data) => {
      dispatch(addNotification({ message: data.message, type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error updating status', type: 'error' }));
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await apiClient.delete(`/api/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      dispatch(addNotification({ message: data.message, type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error deleting user', type: 'error' }));
    }
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    dispatch(addNotification({ message: 'Shop code copied to clipboard!', type: 'success' }));
  };

  const handleToggleStatus = (userId) => {
    if (window.confirm("Are you sure you want to change this user's access status?")) {
      toggleStatusMutation.mutate(userId);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action will delete their account.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading users...</div>;
  }

  // Filter users based on tab and search term
  const filteredUsers = users.filter(user => {
    if (user.role !== activeTab) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm">View and manage all registered users on the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50/50">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('ShopOwner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === 'ShopOwner' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Store className="w-4 h-4" /> Shop Owners
            </button>
            <button
              onClick={() => setActiveTab('Customer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === 'Customer' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <User className="w-4 h-4" /> Customers
            </button>
          </div>

          <div className="w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined Date</th>
                {activeTab === 'ShopOwner' && (
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Shop Code</th>
                )}
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    {activeTab === 'ShopOwner' && (
                      <td className="px-6 py-4">
                        {user.Shops && user.Shops.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              {user.Shops[0].uniqueCode}
                            </span>
                            <button
                              onClick={() => handleCopyCode(user.Shops[0].uniqueCode)}
                              className="text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Copy Shop Code"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">No Shop</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {user.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1.5 rounded-lg transition-colors ${user.status === 'Active'
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-emerald-500 hover:bg-emerald-50'
                            }`}
                          title={user.status === 'Active' ? 'Block User' : 'Activate User'}
                        >
                          {user.status === 'Active' ? <ShieldBan className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Soft Delete User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No {activeTab.toLowerCase()}s found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManager;
