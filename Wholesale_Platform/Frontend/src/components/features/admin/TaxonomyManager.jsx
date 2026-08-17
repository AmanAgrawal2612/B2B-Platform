import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../apiClient';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/notificationSlice';
import { Trash2, Edit2, Plus, ChevronRight, Tags } from 'lucide-react';
import Button from '../../common/Button';
import Input from '../../common/Input';

const TaxonomyManager = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');

  const { data: taxonomy = [], isLoading } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: async () => {
      const res = await apiClient.get('/api/taxonomy');
      return res.data;
    }
  });

  const notify = (msg, type = 'success') => dispatch(addNotification({ message: msg, type }));
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['taxonomy'] });
  const catchError = (err) => notify(err.response?.data?.message || 'Error occurred', 'error');

  // Category Mutations
  const addCat = useMutation({
    mutationFn: async (name) => apiClient.post('/api/admin/taxonomy/category', { name }),
    onSuccess: () => { notify('Category added'); setNewCatName(''); invalidate(); },
    onError: catchError
  });
  const editCat = useMutation({
    mutationFn: async ({ id, name }) => apiClient.put(`/api/admin/taxonomy/category/${id}`, { name }),
    onSuccess: () => { notify('Category updated'); invalidate(); },
    onError: catchError
  });
  const delCat = useMutation({
    mutationFn: async (id) => apiClient.delete(`/api/admin/taxonomy/category/${id}`),
    onSuccess: () => { notify('Category deleted'); setSelectedCategoryId(null); invalidate(); },
    onError: catchError
  });

  // Subcategory Mutations
  const addSub = useMutation({
    mutationFn: async (data) => apiClient.post('/api/admin/taxonomy/subcategory', data),
    onSuccess: () => { notify('Subcategory added'); setNewSubCatName(''); invalidate(); },
    onError: catchError
  });
  const editSub = useMutation({
    mutationFn: async ({ id, name }) => apiClient.put(`/api/admin/taxonomy/subcategory/${id}`, { name }),
    onSuccess: () => { notify('Subcategory updated'); invalidate(); },
    onError: catchError
  });
  const delSub = useMutation({
    mutationFn: async (id) => apiClient.delete(`/api/admin/taxonomy/subcategory/${id}`),
    onSuccess: () => { notify('Subcategory deleted'); invalidate(); },
    onError: catchError
  });

  if (isLoading) return <div className="text-slate-500">Loading taxonomy...</div>;

  const selectedCategory = taxonomy.find(c => c.id === selectedCategoryId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <Tags className="text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-800">Taxonomy Management</h2>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 min-h-[400px]">
        
        {/* Categories Column */}
        <div className="p-6 flex flex-col">
          <h3 className="font-semibold text-slate-700 mb-4 uppercase text-sm tracking-wider">Categories</h3>
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {taxonomy.map(cat => (
              <div 
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedCategoryId === cat.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <span className="font-medium text-slate-800 flex-1">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); const n = prompt('Rename Category:', cat.name); if(n) editCat.mutate({id: cat.id, name: n}); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete category?')) delCat.mutate(cat.id); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                  <ChevronRight className={`w-5 h-5 ml-2 ${selectedCategoryId === cat.id ? 'text-indigo-500' : 'text-slate-300'}`} />
                </div>
              </div>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if(newCatName) addCat.mutate(newCatName); }}>
            <Input placeholder="New Category..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1" />
            <Button type="submit"><Plus className="w-4 h-4" /></Button>
          </form>
        </div>

        {/* Subcategories Column */}
        <div className="p-6 flex flex-col bg-slate-50/50">
          <h3 className="font-semibold text-slate-700 mb-4 uppercase text-sm tracking-wider">
            {selectedCategory ? `Subcategories in ${selectedCategory.name}` : 'Select a Category'}
          </h3>
          
          {selectedCategory ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {selectedCategory.SubCategories?.length === 0 && <div className="text-slate-400 text-sm italic">No subcategories yet.</div>}
                {selectedCategory.SubCategories?.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <span className="font-medium text-slate-700">{sub.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { const n = prompt('Rename Subcategory:', sub.name); if(n) editSub.mutate({id: sub.id, name: n}); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => { if(confirm('Delete subcategory?')) delSub.mutate(sub.id); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if(newSubCatName) addSub.mutate({ name: newSubCatName, categoryId: selectedCategory.id }); }}>
                <Input placeholder="New Subcategory..." value={newSubCatName} onChange={e => setNewSubCatName(e.target.value)} className="flex-1" />
                <Button type="submit"><Plus className="w-4 h-4" /></Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Click a category on the left to manage its subcategories.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TaxonomyManager;
