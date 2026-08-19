import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../apiClient';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/notificationSlice';
import { Trash2, Edit2, Search } from 'lucide-react';
import Button from '../../common/Button';

const TaxonomyManager = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const [newCatName, setNewCatName] = useState('');
  const [newSubCats, setNewSubCats] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const addCat = useMutation({
    mutationFn: async (data) => apiClient.post('/api/admin/taxonomy/category', data),
    onSuccess: () => { 
      notify('Category and subcategories added successfully'); 
      setNewCatName(''); 
      setNewSubCats('');
      invalidate(); 
    },
    onError: catchError
  });

  const editCat = useMutation({
    mutationFn: async ({ id, name }) => apiClient.put(`/api/admin/taxonomy/category/${id}`, { name }),
    onSuccess: () => { notify('Category renamed'); invalidate(); },
    onError: catchError
  });

  const delCat = useMutation({
    mutationFn: async (id) => apiClient.delete(`/api/admin/taxonomy/category/${id}`),
    onSuccess: () => { notify('Category deleted'); invalidate(); },
    onError: catchError
  });

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const subcategories = newSubCats.split(',').map(s => s.trim()).filter(Boolean);
    addCat.mutate({ name: newCatName, subcategories });
  };

  const filteredTaxonomy = taxonomy.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <div className="text-slate-500">Loading taxonomy...</div>;

  return (
    <div className="bg-slate-50 min-h-screen -m-8 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Category Master</h1>
            <p className="text-slate-500">Manage the master list of Categories and Subcategories used globally.</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-emerald-50/30 p-6 rounded-xl shadow-sm border border-emerald-100">
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1 tracking-wider uppercase">Category Name</label>
              <input 
                type="text" 
                placeholder="e.g. Science & Technology" 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="w-full p-3 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1 tracking-wider uppercase">Subcategories (Comma Separated)</label>
              <input 
                type="text" 
                placeholder="e.g. Physics, Chemistry, Biology" 
                value={newSubCats}
                onChange={e => setNewSubCats(e.target.value)}
                className="w-full p-3 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => { setNewCatName(''); setNewSubCats(''); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Save Category
              </Button>
            </div>
          </form>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredTaxonomy.map(cat => (
            <div key={cat.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-3">{cat.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.SubCategories?.map(sub => (
                    <span key={sub.id} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-md border border-emerald-100">
                      {sub.name}
                    </span>
                  ))}
                  {(!cat.SubCategories || cat.SubCategories.length === 0) && (
                    <span className="text-slate-400 text-sm italic">No subcategories</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => { const n = prompt('Rename Category:', cat.name); if(n) editCat.mutate({id: cat.id, name: n}); }} 
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5"/>
                </button>
                <button 
                  onClick={() => { if(confirm('Delete category?')) delCat.mutate(cat.id); }} 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5"/>
                </button>
              </div>
            </div>
          ))}
          {filteredTaxonomy.length === 0 && (
            <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200">
              No categories found.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default TaxonomyManager;
