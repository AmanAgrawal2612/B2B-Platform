import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../apiClient';
import { openModal, closeModal } from '../../../store/uiSlice';
import { addNotification } from '../../../store/notificationSlice';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { Package } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const GlobalCatalogModal = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const activeModal = useSelector(state => state.ui.activeModal);
  const isOpen = activeModal === 'NEW_CATALOG_ITEM';

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const { data: taxonomy = [] } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: async () => {
      const res = await apiClient.get('/api/taxonomy');
      return res.data;
    },
    enabled: isOpen
  });

  const createMasterItemMutation = useMutation({
    mutationFn: async (newItem) => {
      const res = await apiClient.post('/api/catalog', newItem);
      return res.data;
    },
    onSuccess: (data) => {
      dispatch(addNotification({ message: data.message || 'Item successfully added!', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setNewItemName('');
      setPrice('');
      setStock('');
      dispatch(closeModal());
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error creating master item', type: 'error' }));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMasterItemMutation.mutate({ 
      categoryId: selectedCategoryId, 
      subcategoryId: selectedSubcategoryId, 
      itemName: newItemName,
      price,
      currentStock: stock
    });
  };

  const selectedCategory = taxonomy.find(c => c.id === parseInt(selectedCategoryId));
  const subcategories = selectedCategory?.SubCategories || [];

  return (
    <Modal title={<div className="flex items-center gap-2"><Package className="text-amber-500"/> Add to Global Catalog</div>} isOpen={isOpen} maxWidth="max-w-md">
      <p className="text-sm text-slate-500 mb-4">
        {isAdmin 
          ? "Create a new approved item for the global catalog directly." 
          : "This will create a new master item. It will be marked as \"Pending\" until an Admin reviews it, but you can use it immediately in your shop."}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select 
            required
            className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            value={selectedCategoryId} 
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedSubcategoryId('');
            }}
          >
            <option value="">Select a Category...</option>
            {taxonomy.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
          <select 
            required
            className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
            value={selectedSubcategoryId} 
            disabled={!selectedCategoryId}
            onChange={(e) => setSelectedSubcategoryId(e.target.value)}
          >
            <option value="">Select a Subcategory...</option>
            {subcategories.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <Input 
          label="Exact Item Name" required 
          value={newItemName} onChange={e => setNewItemName(e.target.value)}
        />
        
        {!isAdmin && (
          <div className="flex gap-4">
            <Input 
              label="Your Price (₹)" type="number" step="0.01" required 
              value={price} onChange={e => setPrice(e.target.value)}
              className="flex-1"
            />
            <Input 
              label="Initial Stock" type="number" required 
              value={stock} onChange={e => setStock(e.target.value)}
              className="flex-1"
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="ghost" type="button"
            onClick={() => {
              if (isAdmin) {
                dispatch(closeModal());
              } else {
                dispatch(openModal({ modalName: 'ADD_INVENTORY' }));
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="secondary" disabled={createMasterItemMutation.isLoading}>
            Create Master Item
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GlobalCatalogModal;
