import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../apiClient';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/notificationSlice';

const EditItemModal = ({ item, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    if (item) {
      setPrice(item.price);
      setStock(item.currentStock);
    }
  }, [item]);

  const updateInventoryMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await apiClient.put(`/api/inventory/${item.id}`, updatedData);
      return res.data;
    },
    onSuccess: () => {
      dispatch(addNotification({ message: 'Item updated successfully', type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: (err) => {
      dispatch(addNotification({ message: err.response?.data?.message || 'Error updating item', type: 'error' }));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!item) return;
    updateInventoryMutation.mutate({ price, currentStock: stock });
  };

  if (!item) return null;

  return (
    <Modal title={`Edit ${item.MasterItem?.itemName}`} isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <Input 
            label="Price (₹)" type="number" step="0.01" required 
            value={price} onChange={e => setPrice(e.target.value)}
            className="flex-1"
          />
          <Input 
            label="Stock" type="number" required 
            value={stock} onChange={e => setStock(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={updateInventoryMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditItemModal;
