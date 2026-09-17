/**
 * Cart Page - Swiggy/Zomato Style
 * 
 * Features: Item list, Quantity controls, Price breakdown, Checkout button
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../../context';
import { formatCurrency } from '../../utils/helpers';

const Cart = () => {
  const {
    items,
    restaurantName,
    restaurantId,
    removeFromCart,
    updateQuantity,
    getSubtotal,
    clearCart
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  const handleContinueShopping = () => {
    if (restaurantId) {
      navigate(`/restaurants/${restaurantId}`);
    } else {
      navigate('/restaurants');
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty-page">
        <div className="cart-empty-content">
          <div className="empty-cart-illustration">
            <span className="cart-icon-large">🛒</span>
          </div>
          <h2>Your cart is empty</h2>
          <p>You haven't added anything to your cart yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const deliveryFee = 3.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Your Cart</h1>
          <div className="cart-restaurant-info">
            <span className="restaurant-icon">🏪</span>
            <span className="restaurant-name">{restaurantName}</span>
            <button
              className="change-restaurant-btn"
              onClick={handleContinueShopping}
            >
              Change
            </button>
          </div>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items-section">
            <div className="cart-items-header">
              <span className="items-count">{items.length} item(s)</span>
              <button className="clear-cart-btn" onClick={clearCart}>
                Clear Cart
              </button>
            </div>

            <div className="cart-items-list">
              {items.map((item) => (
                <div key={item.itemId} className="cart-item-card">
                  <div className="cart-item-info">
                    <div className="item-veg-indicator">
                      {item.isVegetarian ? (
                        <span className="veg-indicator veg">
                          <span className="dot"></span>
                        </span>
                      ) : (
                        <span className="veg-indicator non-veg">
                          <span className="dot"></span>
                        </span>
                      )}
                    </div>

                    <div className="item-details">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-price">{formatCurrency(item.price)}</p>
                      {item.specialInstructions && (
                        <p className="item-instructions">
                          📝 {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        className="qty-btn minus"
                        onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn plus"
                        onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      {formatCurrency(item.price * item.quantity)}
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.itemId)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-outline continue-btn" onClick={handleContinueShopping}>
              ← Continue Shopping
            </button>
          </div>

          {/* Order Summary */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h3 className="summary-title">Bill Details</h3>

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Item Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>

                <div className="summary-row">
                  <span>GST & Charges</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              </div>

              <div className="summary-total">
                <span>To Pay</span>
                <span className="total-amount">{formatCurrency(total)}</span>
              </div>

              <button
                className="checkout-btn"
                onClick={handleCheckout}
              >
                {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
              </button>

              <div className="summary-note">
                <span className="note-icon">💡</span>
                <span>À la carte pricing is exclusive of taxes</span>
              </div>
            </div>

            {/* Delivery Address Quick View */}
            {isAuthenticated && (
              <div className="delivery-address-card">
                <div className="address-header">
                  <span className="address-icon">📍</span>
                  <span className="address-title">Delivery Address</span>
                </div>
                <p className="address-text">
                  Add your delivery address at checkout
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
