/**
 * Cart Context
 * 
 * Manages shopping cart state
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cartData = JSON.parse(savedCart);
      setItems(cartData.items || []);
      setRestaurantId(cartData.restaurantId || null);
      setRestaurantName(cartData.restaurantName || '');
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify({
      items,
      restaurantId,
      restaurantName
    }));
  }, [items, restaurantId, restaurantName]);

  // Add item to cart
  const addToCart = (item, restaurant) => {
    // Check if adding from same restaurant
    if (restaurantId && restaurantId !== restaurant.restaurantId) {
      if (!window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
        return false;
      }
      // Clear cart for new restaurant
      setItems([{
        ...item,
        quantity: item.quantity || 1
      }]);
      setRestaurantId(restaurant.restaurantId);
      setRestaurantName(restaurant.name);
      return true;
    }

    // Check if item already exists
    const existingIndex = items.findIndex(i => i.itemId === item.itemId);

    if (existingIndex >= 0) {
      // Update quantity
      const newItems = [...items];
      newItems[existingIndex].quantity += (item.quantity || 1);
      setItems(newItems);
    } else {
      // Add new item
      setItems([...items, { ...item, quantity: item.quantity || 1 }]);
    }

    setRestaurantId(restaurant.restaurantId);
    setRestaurantName(restaurant.name);
    return true;
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    const newItems = items.filter(item => item.itemId !== itemId);
    setItems(newItems);

    if (newItems.length === 0) {
      setRestaurantId(null);
      setRestaurantName('');
    }
  };

  // Update item quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const newItems = items.map(item =>
      item.itemId === itemId ? { ...item, quantity } : item
    );
    setItems(newItems);
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName('');
    localStorage.removeItem('cart');
  };

  // Calculate totals
  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    items,
    restaurantId,
    restaurantName,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
