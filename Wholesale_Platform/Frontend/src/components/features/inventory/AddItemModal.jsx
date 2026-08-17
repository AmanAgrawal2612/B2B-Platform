import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../apiClient';
import { openModal, closeModal } from '../../../store/uiSlice';
import { addNotification } from '../../../store/notificationSlice';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';

const AddItemModal = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const activeModal = useSelector(state => state.ui.activeModal);
  const isOpen = activeModal === 'ADD_INVENTORY';

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedMasterId, setSelectedMasterId] = useState('');
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

  const { data: catalog = [] } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const res = await apiClient.get('/api/catalog');
      return res.data;
    },
    enabled: isOpen
  });

  const addToInventoryMutation = useMutation({
    mutationFn: async (newItem) => {
      const res = await apiClient.post('/api/inventory', newItem);
      return res.data;
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Item added to inventory successfully', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      dispatch(closeModal());
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setSelectedMasterId('');
      setPrice('');
      setStock('');
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error adding to inventory', type: 'error' }));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMasterId) return;
    addToInventoryMutation.mutate({ masterItemId: selectedMasterId, price, currentStock: stock });
  };

  const selectedCategory = taxonomy.find(c => c.id === parseInt(selectedCategoryId));
  const subcategories = selectedCategory?.SubCategories || [];
  
  const filteredItems = catalog.filter(item => 
    item.categoryId === parseInt(selectedCategoryId) && 
    item.subcategoryId === parseInt(selectedSubcategoryId)
  );

  return (
    <Modal title="Add Item to Inventory" isOpen={isOpen} maxWidth="max-w-lg">
      <div className="space-y-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select 
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={selectedCategoryId} 
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedSubcategoryId('');
                setSelectedMasterId('');
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
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
              value={selectedSubcategoryId} 
              disabled={!selectedCategoryId}
              onChange={(e) => {
                setSelectedSubcategoryId(e.target.value);
                setSelectedMasterId('');
              }}
            >
              <option value="">Select a Subcategory...</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
            <select 
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
              value={selectedMasterId} 
              disabled={!selectedSubcategoryId}
              onChange={(e) => setSelectedMasterId(e.target.value)}
            >
              <option value="">Select Item Name...</option>
              {filteredItems.map(item => (
                <option key={item.id} value={item.id}>{item.itemName}</option>
              ))}
            </select>
            {selectedSubcategoryId && filteredItems.length === 0 && (
               <p className="text-xs text-amber-600 mt-1">No items found in this subcategory.</p>
            )}
          </div>
        </div>

        {selectedMasterId && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
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
            <Button type="submit" fullWidth disabled={addToInventoryMutation.isLoading}>
              Save to My Inventory
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-3 text-center">Can't find what you're looking for?</p>
          <Button 
            variant="secondary" fullWidth 
            onClick={() => dispatch(openModal({ modalName: 'NEW_CATALOG_ITEM' }))}
          >
            Add New Product to Global Catalog
          </Button>
        </div>

      </div>
    </Modal>
  );
};

export default AddItemModal;
