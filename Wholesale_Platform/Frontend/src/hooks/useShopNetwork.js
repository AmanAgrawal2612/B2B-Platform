import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/notificationSlice';

export const useShopNetwork = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  // Fetch connected shops
  const { data: connections = [], isLoading: isFetching, error: fetchError } = useQuery({
    queryKey: ['connectedShops'],
    queryFn: async () => {
      const res = await apiClient.get('/api/shops/connected-shops');
      return res.data;
    }
  });

  // Connect to a new shop mutation
  const connectMutation = useMutation({
    mutationFn: async (uniqueCode) => {
      const res = await apiClient.post('/api/shops/connect', { uniqueCode });
      return res.data;
    },
    onSuccess: (data) => {
      dispatch(addNotification({ message: data.message, type: 'success' }));
      queryClient.invalidateQueries({ queryKey: ['connectedShops'] });
    },
    onError: (error) => {
      dispatch(addNotification({ message: error.response?.data?.message || "Failed to connect to shop", type: 'error' }));
    }
  });

  const connectToShop = async (uniqueCode) => {
    return connectMutation.mutateAsync(uniqueCode);
  };

  return {
    connections,
    isFetching,
    fetchError,
    connectToShop,
    isConnecting: connectMutation.isLoading
  };
};
