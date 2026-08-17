import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import apiClient from '../../../apiClient';
import { addNotification } from '../../../store/notificationSlice';
import { useCart } from '../../../hooks/useCart';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';

const CartSidebar = ({ shopId, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems: cart, subtotal, setItemQuantity, removeItem, emptyCart } = useCart(shopId);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleUpdateQty = (inventoryId, newQty, maxStock) => {
    if (newQty < 1) return;
    if (newQty > maxStock) {
      dispatch(addNotification({ message: 'Cannot exceed available stock', type: 'error' }));
      return;
    }
    setItemQuantity(inventoryId, newQty);
  };

  const handleRemove = (inventoryId) => {
    removeItem(inventoryId);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);
    try {
      const payload = {
        shopId,
        items: cart.map(item => ({ itemId: item.inventoryId, quantity: item.quantity }))
      };
      
      const res = await apiClient.post('/api/orders/place', payload);
      
      emptyCart();
      dispatch(addNotification({ message: 'Order placed successfully!', type: 'success' }));
      onClose();
      // Wait for toast, then navigate to orders view based on role
      setTimeout(() => {
        // We know they are on /shop/:id, navigate back to their dashboard or purchases
        navigate(-1); 
      }, 1500);
      
    } catch (err) {
      dispatch(addNotification({ 
        message: err.response?.data?.message || 'Failed to place order', 
        type: 'error' 
      }));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium text-lg">Your cart is empty.</p>
              <p className="text-slate-400 text-sm mt-1">Add items from the catalog to get started.</p>
            </div>
          ) : (
            cart.map((cartItem) => {
              const { itemData, quantity, inventoryId } = cartItem;
              return (
                <div key={inventoryId} className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{itemData.MasterItem?.itemName}</h4>
                    <p className="text-emerald-600 font-semibold mb-3">₹{parseFloat(itemData.price).toFixed(2)}</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button 
                          className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                          onClick={() => handleUpdateQty(inventoryId, quantity - 1, itemData.currentStock)}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                        <button 
                          className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                          onClick={() => handleUpdateQty(inventoryId, quantity + 1, itemData.currentStock)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleRemove(inventoryId)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Total</p>
                    <div className="font-bold text-slate-800 whitespace-nowrap">₹{(quantity * parseFloat(itemData.price)).toFixed(2)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-slate-100 p-6 bg-slate-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="text-2xl font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>
            
            <Button 
              className="w-full flex justify-center items-center gap-2 py-4 text-lg shadow-blue-500/30 shadow-lg"
              onClick={handleCheckout}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? 'Processing...' : 'Place Wholesale Order'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
