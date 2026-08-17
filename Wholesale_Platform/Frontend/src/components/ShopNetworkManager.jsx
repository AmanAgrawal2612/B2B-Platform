import React from 'react';
import apiClient from '../apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/notificationSlice';
import { Users } from 'lucide-react';
import CustomerTable from './features/network/CustomerTable';

const ShopNetworkManager = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const { data: connections = [], isLoading: loading } = useQuery({
    queryKey: ['shopNetwork'],
    queryFn: async () => {
      const res = await apiClient.get('/api/shops/network');
      return res.data;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ connectionId, status }) => {
      await apiClient.put(`/api/shops/network/${connectionId}/status`, { status });
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Customer status updated', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['shopNetwork'] });
    },
    onError: (error) => {
      dispatch(addNotification({ message: error.response?.data?.message || `Error updating status`, type: 'error' }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (connectionId) => {
      await apiClient.delete(`/api/shops/network/${connectionId}`);
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Customer removed from network', type: 'info' }));
      queryClient.invalidateQueries({ queryKey: ['shopNetwork'] });
    },
    onError: (error) => {
      dispatch(addNotification({ message: error.response?.data?.message || 'Error deleting customer', type: 'error' }));
    }
  });

  const toggleStatus = (connectionId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    const actionText = currentStatus === 'Active' ? 'Deactivate' : 'Activate';
    
    if (!window.confirm(`Are you sure you want to ${actionText} this customer?`)) return;
    toggleStatusMutation.mutate({ connectionId, status: newStatus });
  };

  const handleDelete = (connectionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this customer from your network? This action cannot be undone.")) return;
    deleteMutation.mutate(connectionId);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading network...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-blue-600" /> Customer Network
        </h2>
      </div>

      <CustomerTable 
        connections={connections}
        onToggleStatus={toggleStatus}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ShopNetworkManager;
