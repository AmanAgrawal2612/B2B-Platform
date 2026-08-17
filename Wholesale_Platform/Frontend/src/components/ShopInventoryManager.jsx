import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/notificationSlice';
import { openModal } from '../store/uiSlice';
import { Package, Plus } from 'lucide-react';
import Button from './common/Button';
import InventoryTable from './features/inventory/InventoryTable';
import AddItemModal from './features/inventory/AddItemModal';
import GlobalCatalogModal from './features/inventory/GlobalCatalogModal';
import LowStockWidget from './features/inventory/LowStockWidget';
import EditItemModal from './features/inventory/EditItemModal';
import { useState } from 'react';

const ShopInventoryManager = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [editingItem, setEditingItem] = useState(null);
  
  const { data: inventory = [], isLoading: invLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await apiClient.get('/api/inventory');
      return res.data;
    }
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/inventory/${id}`);
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Item removed from inventory', type: 'info' }));
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: () => {
      dispatch(addNotification({ message: 'Error deleting item', type: 'error' }));
    }
  });

  const handleDelete = (id) => {
    if (!window.confirm("Remove this item from your inventory?")) return;
    deleteInventoryMutation.mutate(id);
  };

  if (invLoading) return <div className="p-8 text-center text-slate-500">Loading inventory...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="text-emerald-600" /> My Inventory
        </h2>
        <Button onClick={() => dispatch(openModal({ modalName: 'ADD_INVENTORY' }))}>
          <Plus className="w-5 h-5" /> Add Item
        </Button>
      </div>

      <LowStockWidget inventory={inventory} />

      <InventoryTable inventory={inventory} onDelete={handleDelete} onEdit={setEditingItem} />
      
      {/* Global Modals for this view */}
      <AddItemModal />
      <GlobalCatalogModal />
      <EditItemModal 
        item={editingItem} 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
      />
    </div>
  );
};

export default ShopInventoryManager;

