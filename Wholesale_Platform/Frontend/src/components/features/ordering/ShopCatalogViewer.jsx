import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../apiClient';
import { useDispatch } from 'react-redux';
import { ArrowLeft, ShoppingCart, Plus, Minus, Search } from 'lucide-react';
import { addNotification } from '../../../store/notificationSlice';
import { useCart } from '../../../hooks/useCart';
import CartSidebar from './CartSidebar';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from 'react-select';

const ShopCatalogViewer = () => {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [quantities, setQuantities] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: taxonomy = [] } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: async () => {
      const res = await apiClient.get('/api/taxonomy');
      return res.data;
    }
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['shopInventory', uniqueCode],
    queryFn: async () => {
      const res = await apiClient.get(`/api/inventory/catalog/${uniqueCode}`);
      return res.data;
    },
    retry: false
  });

  const internalShopId = data?.shopId;
  const inventory = data?.inventory || [];

  const { cartItemCount, addItem } = useCart(internalShopId);

  const handleQuantityChange = (id, val) => {
    const value = Math.max(1, parseInt(val) || 1);
    setQuantities(prev => ({ ...prev, [id]: value }));
  };

  const handleAddToCart = (item) => {
    const qty = quantities[item.id] || 1;
    if (qty > item.currentStock) {
      dispatch(addNotification({ message: 'Not enough stock available', type: 'error' }));
      return;
    }
    if (!internalShopId) return;
    addItem(item, qty);
    dispatch(addNotification({ message: 'Added to cart', type: 'success' }));
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  if (error) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-red-500 mb-4">{error.response?.data?.message || 'Error loading catalog'}</p>
        <Button onClick={() => navigate('/order')}>Back to Order Products</Button>
      </div>
    );
  }

  const selectedCategory = taxonomy.find(c => c.id === parseInt(selectedCategoryId));
  const subcategories = selectedCategory?.SubCategories || [];

  const categoryOptions = taxonomy.map(cat => ({ value: cat.id, label: cat.name }));
  const subcategoryOptions = subcategories.map(sub => ({ value: sub.id, label: sub.name }));

  const currentCategoryOption = categoryOptions.find(o => o.value === parseInt(selectedCategoryId)) || null;
  const currentSubcategoryOption = subcategoryOptions.find(o => o.value === parseInt(selectedSubcategoryId)) || null;

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.MasterItem?.itemName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId ? item.MasterItem?.categoryId === parseInt(selectedCategoryId) : true;
    const matchesSubCategory = selectedSubcategoryId ? item.MasterItem?.subcategoryId === parseInt(selectedSubcategoryId) : true;
    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <button 
          onClick={() => navigate('/order')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        
        <h1 className="text-xl font-bold text-slate-800">Shop Catalog</h1>
        
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-xs flex items-center justify-center rounded-full font-bold">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="w-full md:w-64">
            <Select 
              placeholder="All Categories"
              options={categoryOptions}
              value={currentCategoryOption}
              onChange={(val) => {
                setSelectedCategoryId(val ? val.value : '');
                setSelectedSubcategoryId('');
              }}
              isClearable
            />
          </div>

          <div className="w-full md:w-64">
            <Select 
              placeholder="All Subcategories"
              options={subcategoryOptions}
              value={currentSubcategoryOption}
              isDisabled={!selectedCategoryId}
              onChange={(val) => setSelectedSubcategoryId(val ? val.value : '')}
              isClearable
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-slate-500 py-12">Loading inventory...</p>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredInventory.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col">
                <div className="h-40 bg-slate-100 flex items-center justify-center border-b border-slate-200">
                  <span className="text-4xl text-slate-300 font-bold uppercase">{item.MasterItem?.itemName?.substring(0, 2)}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{item.MasterItem?.itemName}</h3>
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-slate-500">Stock: <span className="font-medium text-slate-700">{item.currentStock}</span></span>
                    <span className="text-slate-500">Unit: {item.MasterItem?.unitOfMeasure}</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-600 mb-4">₹{parseFloat(item.price).toFixed(2)}</p>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button 
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input 
                        type="number" 
                        min="1"
                        max={item.currentStock}
                        value={quantities[item.id] || 1}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="flex-1 w-full text-center py-2 focus:outline-none"
                      />
                      <button 
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600"
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => handleAddToCart(item)}
                      disabled={item.currentStock <= 0}
                    >
                      {item.currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCartOpen && internalShopId && (
        <CartSidebar 
          shopId={internalShopId} 
          onClose={() => setIsCartOpen(false)} 
        />
      )}
    </div>
  );
};

export default ShopCatalogViewer;
