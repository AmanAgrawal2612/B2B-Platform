import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { 
  Users, Package, Activity, AlertTriangle, 
  CheckCircle, Clock, ShieldCheck, Store
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();

  const { data: stats = { users: 0, shops: 0, orders: 0 }, isLoading: loading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/admin/stats');
      return res.data;
    }
  });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading system stats...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">System Administration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><Users className="w-8 h-8" /></div>
          <div>
            <p className="text-slate-500 font-medium">Total Users</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Store className="w-8 h-8" /></div>
          <div>
            <p className="text-slate-500 font-medium">Total Shops</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.shops}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600"><Activity className="w-8 h-8" /></div>
          <div>
            <p className="text-slate-500 font-medium">Total Orders</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.orders}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center mt-6">
        <div className="bg-amber-100 text-amber-600 p-4 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">System Logs</h3>
        <p className="text-slate-500 mt-2 max-w-md">No critical warnings found. All ML forecasting jobs and background processes are operating optimally.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
