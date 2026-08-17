import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity, removeFromCart, clearCart } from '../store/cartSlice';

export const useCart = (shopId) => {
  const dispatch = useDispatch();
  
  // Safely grab the cart for this specific shop, or default to an empty array
  const cartItems = useSelector(state => shopId ? state.cart.carts[shopId] || [] : []);
  
  // Calculate derived state
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.quantity * parseFloat(item.itemData?.price || 0)), 0);

  // Actions
  const addItem = (inventoryItem, quantity) => {
    if (!shopId) return;
    dispatch(addToCart({ shopId, inventoryItem, quantity }));
  };

  const setItemQuantity = (inventoryId, quantity) => {
    if (!shopId) return;
    dispatch(updateQuantity({ shopId, inventoryId, quantity }));
  };

  const removeItem = (inventoryId) => {
    if (!shopId) return;
    dispatch(removeFromCart({ shopId, inventoryId }));
  };

  const emptyCart = () => {
    if (!shopId) return;
    dispatch(clearCart({ shopId }));
  };

  return {
    cartItems,
    cartItemCount,
    subtotal,
    addItem,
    setItemQuantity,
    removeItem,
    emptyCart
  };
};
