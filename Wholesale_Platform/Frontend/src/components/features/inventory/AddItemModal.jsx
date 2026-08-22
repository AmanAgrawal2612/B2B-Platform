import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../apiClient';
import { openModal, closeModal } from '../../../store/uiSlice';
import { addNotification } from '../../../store/notificationSlice';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from 'react-select';

const AddItemModal = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const activeModal = useSelector(state => state.ui.activeModal);
  const isOpen = activeModal === 'ADD_INVENTORY';

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // Array of selected option objects { value, label }
  const [itemDetails, setItemDetails] = useState({}); // { [masterId]: { price: '', stock: '' } }
  const [failedItems, setFailedItems] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setSelectedItems([]);
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

  const { data: catalog = [] } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const res = await apiClient.get('/api/catalog');
      return res.data;
    },
    enabled: isOpen
  });

  const addToInventoryMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedItems.map(item => {
        const details = itemDetails[item.value] || { price: 0, stock: 0 };
        return apiClient.post('/api/inventory', {
          masterItemId: item.value,
          price: details.price,
          currentStock: details.stock
        });
      });
      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Items added to inventory successfully', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      dispatch(closeModal());
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setSelectedItems([]);
      setItemDetails({});
      setFailedItems([]);
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error adding to inventory', type: 'error' }));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    
    const inventory = queryClient.getQueryData(['inventory']) || [];
    const inventoryMasterIds = inventory.map(item => item.masterItemId);
    
    const duplicateItems = selectedItems.filter(item => inventoryMasterIds.includes(item.value));
    
    if (duplicateItems.length > 0) {
      const duplicateIds = duplicateItems.map(item => item.value);
      setFailedItems(duplicateIds);
      dispatch(addNotification({ message: `${duplicateItems.length} item(s) already exist in your inventory. Nothing was saved.`, type: 'error' }));
      return;
    }

    addToInventoryMutation.mutate();
  };

  const handleDetailChange = (id, field, value) => {
    setItemDetails(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const selectedCategory = taxonomy.find(c => c.id === parseInt(selectedCategoryId));
  const subcategories = selectedCategory?.SubCategories || [];
  
  const filteredItems = catalog.filter(item => 
    item.categoryId === parseInt(selectedCategoryId) && 
    item.subcategoryId === parseInt(selectedSubcategoryId)
  );

  const categoryOptions = taxonomy.map(cat => ({ value: cat.id, label: cat.name }));
  const subcategoryOptions = subcategories.map(sub => ({ value: sub.id, label: sub.name }));
  const itemOptions = filteredItems.map(item => ({ value: item.id, label: item.itemName }));

  const currentCategoryOption = categoryOptions.find(o => o.value === parseInt(selectedCategoryId)) || null;
  const currentSubcategoryOption = subcategoryOptions.find(o => o.value === parseInt(selectedSubcategoryId)) || null;

  return (
    <Modal title="Add Items to Inventory" isOpen={isOpen} maxWidth="max-w-lg">
      <div className="space-y-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <Select 
              placeholder="Search or select a Category..."
              options={categoryOptions}
              value={currentCategoryOption}
              onChange={(val) => {
                setSelectedCategoryId(val ? val.value : '');
                setSelectedSubcategoryId('');
                setSelectedItems([]);
              }}
              isClearable
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
            <Select 
              placeholder="Search or select a Subcategory..."
              options={subcategoryOptions}
              value={currentSubcategoryOption}
              isDisabled={!selectedCategoryId}
              onChange={(val) => {
                setSelectedSubcategoryId(val ? val.value : '');
                setSelectedItems([]);
              }}
              isClearable
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name(s)</label>
            <Select 
              isMulti
              placeholder="Search and select multiple items..."
              options={itemOptions}
              value={selectedItems}
              isDisabled={!selectedSubcategoryId}
              onChange={(vals) => setSelectedItems(vals || [])}
              isClearable
            />
            {selectedSubcategoryId && filteredItems.length === 0 && (
               <p className="text-xs text-amber-600 mt-1">No items found in this subcategory.</p>
            )}
          </div>
        </div>

        {selectedItems.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Set Prices & Initial Stock</h3>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {selectedItems.map(item => {
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
            <Button type="submit" fullWidth disabled={addToInventoryMutation.isLoading}>
              Save {selectedItems.length} Item(s) to Inventory
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
