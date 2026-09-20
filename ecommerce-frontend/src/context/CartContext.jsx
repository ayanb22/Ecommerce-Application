import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as cartApi from '../api/cart';
import { extractErrorMessage } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.fetchCart();
      setCart(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your cart.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Reload (or clear) the cart whenever auth state changes — logging out
  // should immediately clear the previous user's cart from view.
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (productId) => {
    setError(null);
    try {
      const result = await cartApi.addToCart(productId);
      setCart(result.cart);
      return result;
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not add that item to your cart.');
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    setError(null);
    try {
      await cartApi.updateCartItem(itemId, quantity);
      await refreshCart();
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not update that item.');
      setError(message);
      throw new Error(message);
    }
  }, [refreshCart]);

  const removeItem = useCallback(async (productId) => {
    setError(null);
    try {
      await cartApi.removeFromCart(productId);
      await refreshCart();
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not remove that item.');
      setError(message);
      throw new Error(message);
    }
  }, [refreshCart]);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, itemCount, loading, error, refreshCart, addItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
