import React from 'react';
import apiClient from '../apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/notificationSlice';
import PendingCatalogTable from './features/admin/PendingCatalogTable';
import ApprovedCatalogTable from './features/admin/ApprovedCatalogTable';
import GlobalCatalogModal from './features/inventory/GlobalCatalogModal';
import { openModal } from '../store/uiSlice';
import Button from './common/Button';
import { Plus } from 'lucide-react';

const AdminCatalogManager = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const { data: pendingItems = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingCatalog'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await apiClient.get('/api/admin/catalog/pending');
      return res.data;
    }
  });

  const { data: approvedItems = [], isLoading: approvedLoading } = useQuery({
    queryKey: ['approvedCatalog'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await apiClient.get('/api/catalog');
      return res.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      await apiClient.put(`/api/admin/catalog/${id}/approve`, {});
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Item approved successfully', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['pendingCatalog'] });
      queryClient.invalidateQueries({ queryKey: ['approvedCatalog'] });
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error approving item', type: 'error' }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/api/admin/catalog/${id}`);
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Item deleted', type: 'info' }));
      queryClient.invalidateQueries({ queryKey: ['pendingCatalog'] });
      queryClient.invalidateQueries({ queryKey: ['approvedCatalog'] });
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error deleting item', type: 'error' }));
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, itemName }) => {
      await apiClient.put(`/api/admin/catalog/${id}`, { itemName });
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Item name updated', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['pendingCatalog'] });
      queryClient.invalidateQueries({ queryKey: ['approvedCatalog'] });
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error updating item', type: 'error' }));
    }
  });

  const handleApprove = (id) => {
    approveMutation.mutate(id);
  };

  const handleEdit = (id, currentName) => {
    const newName = prompt('Edit Item Name:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
      editMutation.mutate({ id, itemName: newName.trim() });
    }
  };

  const handleDelete = (id, isApproved = false) => {
    const msg = isApproved 
      ? "Are you sure you want to delete this approved item from the global catalog? It might be used by shops!"
      : "Are you sure you want to delete this spam/duplicate item?";
    if (!window.confirm(msg)) return;
    deleteMutation.mutate(id);
  };

  if (pendingLoading || approvedLoading) return <div className="p-8 text-center text-slate-500">Loading catalog requests...</div>;

  return (
    <div className="p-8 space-y-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Master Catalog Management</h1>
        <Button onClick={() => dispatch(openModal({ modalName: 'NEW_CATALOG_ITEM' }))}>
          <Plus className="w-5 h-5 mr-2" /> Add Global Item
        </Button>
      </div>
      <PendingCatalogTable items={pendingItems} onApprove={handleApprove} onDelete={handleDelete} onEdit={handleEdit} />
      <ApprovedCatalogTable items={approvedItems} onDelete={handleDelete} onEdit={handleEdit} />

      <GlobalCatalogModal />
    </div>
  );
};

export default AdminCatalogManager;
