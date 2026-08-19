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

import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

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
    mutationFn: async (payload) => {
      const { categoryId, subcategoryId, itemNames, price, currentStock, isAdmin } = payload;
      
      if (isAdmin) {
        for (const name of itemNames) {
          await apiClient.post('/api/catalog', { categoryId, subcategoryId, itemName: name });
        }
        return { message: `${itemNames.length} item(s) successfully added!` };
      } else {
        const res = await apiClient.post('/api/catalog', { 
          categoryId, subcategoryId, itemName: itemNames[0], price, currentStock 
        });
        return res.data;
      }
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
    
    const itemNames = isAdmin 
      ? newItemName.split(',').map(s => s.trim()).filter(Boolean)
      : [newItemName.trim()];

    if (itemNames.length === 0) return;

    createMasterItemMutation.mutate({ 
      categoryId: selectedCategoryId, 
      subcategoryId: selectedSubcategoryId, 
      itemNames,
      price,
      currentStock: stock,
      isAdmin
    });
  };

  const selectedCategory = taxonomy.find(c => c.id === parseInt(selectedCategoryId));
  const subcategories = selectedCategory?.SubCategories || [];

  const categoryOptions = taxonomy.map(cat => ({ value: cat.id, label: cat.name }));
  const subcategoryOptions = subcategories.map(sub => ({ value: sub.id, label: sub.name }));

  const currentCategoryOption = categoryOptions.find(o => o.value === selectedCategoryId) || (selectedCategoryId ? { value: selectedCategoryId, label: selectedCategoryId } : null);
  const currentSubcategoryOption = subcategoryOptions.find(o => o.value === selectedSubcategoryId) || (selectedSubcategoryId ? { value: selectedSubcategoryId, label: selectedSubcategoryId } : null);

  const CategorySelectComponent = isAdmin ? CreatableSelect : Select;

  return (
    <Modal title={<div className="flex items-center gap-2"><Package className="text-amber-500"/> Add to Global Catalog</div>} isOpen={isOpen} maxWidth="max-w-md">
      <p className="text-sm text-slate-500 mb-4">
        {isAdmin 
          ? "Create multiple approved items instantly by separating their names with commas." 
          : "This will create a new master item. It will be marked as \"Pending\" until an Admin reviews it, but you can use it immediately in your shop."}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <CategorySelectComponent
            required
            placeholder="Select or search a Category..."
            options={categoryOptions}
            value={currentCategoryOption}
            onChange={(val) => {
              setSelectedCategoryId(val ? val.value : '');
              setSelectedSubcategoryId('');
            }}
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
          <CreatableSelect
            required
            placeholder="Select, search, or create a Subcategory..."
            options={subcategoryOptions}
            value={currentSubcategoryOption}
            isDisabled={!selectedCategoryId}
            onChange={(val) => setSelectedSubcategoryId(val ? val.value : '')}
            isClearable
          />
        </div>

        <Input 
          label={isAdmin ? "Item Names (Comma Separated)" : "Exact Item Name"} 
          required 
          value={newItemName} 
          onChange={e => setNewItemName(e.target.value)}
          placeholder={isAdmin ? "e.g. Cello Gripper, Reynolds 045" : ""}
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
