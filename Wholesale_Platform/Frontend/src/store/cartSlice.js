import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // state.carts will be a dictionary of shopId -> cartItems
  // e.g. { "1": [{ inventoryId: 5, quantity: 2, item: {...} }] }
  carts: {}
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { shopId, inventoryItem, quantity } = action.payload;
      
      if (!state.carts[shopId]) {
        state.carts[shopId] = [];
      }
      
      const shopCart = state.carts[shopId];
      const existingItem = shopCart.find(item => item.inventoryId === inventoryItem.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        shopCart.push({
          inventoryId: inventoryItem.id,
          quantity,
          itemData: inventoryItem // storing full item data for display purposes
        });
      }
    },
    updateQuantity: (state, action) => {
      const { shopId, inventoryId, quantity } = action.payload;
      const shopCart = state.carts[shopId];
      if (shopCart) {
        const item = shopCart.find(item => item.inventoryId === inventoryId);
        if (item) {
          item.quantity = quantity;
        }
      }
    },
    removeFromCart: (state, action) => {
      const { shopId, inventoryId } = action.payload;
      const shopCart = state.carts[shopId];
      if (shopCart) {
        state.carts[shopId] = shopCart.filter(item => item.inventoryId !== inventoryId);
      }
    },
    clearCart: (state, action) => {
      const { shopId } = action.payload;
      if (state.carts[shopId]) {
        state.carts[shopId] = [];
      }
    }
  }
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
