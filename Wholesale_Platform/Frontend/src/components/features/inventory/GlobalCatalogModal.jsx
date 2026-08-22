import React, { useState, useEffect } from 'react';
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
  const [newItemName, setNewItemName] = useState(''); // Used by Admin
  const [createdItems, setCreatedItems] = useState([]); // Array of { label, value } used by Shop Owner
  const [itemDetails, setItemDetails] = useState({}); // { [tagValue]: { price: '', stock: '' } }
  const [failedItems, setFailedItems] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setNewItemName('');
      setCreatedItems([]);
      setItemDetails({});
      setFailedItems([]);
    }
  }, [isOpen]);

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
      const { categoryId, subcategoryId, itemNames, isAdmin, itemDetails } = payload;
      
      if (isAdmin) {
        for (const name of itemNames) {
          await apiClient.post('/api/catalog', { categoryId, subcategoryId, itemName: name });
        }
        return { message: `${itemNames.length} item(s) successfully added!` };
      } else {
        const promises = itemNames.map(name => {
          const details = itemDetails[name] || { price: 0, stock: 0 };
          return apiClient.post('/api/catalog', { 
            categoryId, subcategoryId, itemName: name, price: details.price, currentStock: details.stock 
          });
        });
        await Promise.all(promises);
        return { message: `${itemNames.length} pending item(s) proposed!` };
      }
    },
    onSuccess: (data) => {
      dispatch(addNotification({ message: data.message || 'Items successfully added!', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      queryClient.invalidateQueries({ queryKey: ['approvedCatalog'] });
      queryClient.invalidateQueries({ queryKey: ['pendingCatalog'] });
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setNewItemName('');
      setCreatedItems([]);
      setItemDetails({});
      setFailedItems([]);
      dispatch(closeModal());
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error creating master item', type: 'error' }));
    }
  });

  const handleDetailChange = (id, field, value) => {
    setItemDetails(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemNames = isAdmin 
      ? newItemName.split(',').map(s => s.trim()).filter(Boolean)
      : createdItems.map(item => item.value.trim());

    if (itemNames.length === 0) return;

    if (!isAdmin) {
      const inventory = queryClient.getQueryData(['inventory']) || [];
      const duplicateNames = [];
      
      itemNames.forEach(name => {
        const exists = inventory.some(invItem => 
          invItem.MasterItem?.categoryId === parseInt(selectedCategoryId) &&
          invItem.MasterItem?.subcategoryId === parseInt(selectedSubcategoryId) &&
          invItem.MasterItem?.itemName.toLowerCase() === name.toLowerCase()
        );
        if (exists) duplicateNames.push(name);
      });

      if (duplicateNames.length > 0) {
        setFailedItems(duplicateNames);
        dispatch(addNotification({ message: `${duplicateNames.length} item(s) already exist in your inventory. Nothing was saved.`, type: 'error' }));
        return;
      }
    }

    createMasterItemMutation.mutate({ 
      categoryId: selectedCategoryId, 
      subcategoryId: selectedSubcategoryId, 
      itemNames,
      itemDetails,
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

        {isAdmin ? (
          <Input 
            label="Item Names (Comma Separated)"
            required 
            value={newItemName} 
            onChange={e => setNewItemName(e.target.value)}
            placeholder="e.g. Cello Gripper, Reynolds 045"
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name(s)</label>
            <CreatableSelect
              isMulti
              placeholder="Type an item name and press Enter..."
              value={createdItems}
              onChange={(vals) => setCreatedItems(vals || [])}
              components={{ DropdownIndicator: null }}
              formatCreateLabel={(userInput) => `Add "${userInput}"`}
              noOptionsMessage={() => "Type a name and press Enter to add it"}
            />
          </div>
        )}
        
        {!isAdmin && createdItems.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Set Prices & Initial Stock</h3>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {createdItems.map(item => {
                const isFailed = failedItems.includes(item.value);
                return (
                  <div key={item.value} className={`p-3 rounded-lg border ${isFailed ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-sm font-medium mb-2 ${isFailed ? 'text-red-800' : 'text-slate-800'}`}>
                      {item.label} {isFailed && <span className="text-red-500 font-bold ml-1">(Already Exists)</span>}
                    </p>
                    <div className="flex gap-4">
                      <Input 
                        label="Your Price (₹)" type="number" step="0.01" required 
                        value={itemDetails[item.value]?.price || ''} 
                        onChange={e => handleDetailChange(item.value, 'price', e.target.value)}
                        className="flex-1"
                      />
                      <Input 
                        label="Initial Stock" type="number" required 
                        value={itemDetails[item.value]?.stock || ''} 
                        onChange={e => handleDetailChange(item.value, 'stock', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
