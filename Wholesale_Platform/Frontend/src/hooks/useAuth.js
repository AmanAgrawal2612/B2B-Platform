import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);

  const isShopOwner = user?.role === 'ShopOwner';
  const isCustomer = user?.role === 'Customer';
  const isAdmin = user?.role === 'Admin';

  const logout = () => {
    dispatch(logoutAction());
  };

  return {
    user,
    loading,
    isShopOwner,
    isCustomer,
    isAdmin,
    logout
  };
};
