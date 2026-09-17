/**
 * Checkout Page - Swiggy/Zomato Style
 * 
 * Features: Address Form, Payment Selection, Order Summary, Place Order
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../../context';
import { ordersAPI } from '../../api';
import { formatCurrency } from '../../utils/helpers';

const PAYMENT_METHODS = [
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', description: 'Pay when your order arrives' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
  { id: 'debit_card', label: 'Debit Card', icon: '💳', description: 'All major debit cards' },
  { id: 'online_payment', label: 'Online Payment', icon: '📱', description: 'UPI, Net Banking, Wallets' }
];

const Checkout = () => {
  const {
    items,
    restaurantId,
    restaurantName,
    getSubtotal,
    clearCart
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deliveryAddress: '',
    deliveryNotes: '',
    paymentMethod: 'cash_on_delivery'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirm

  useEffect(() => {
    // Pre-fill address from user profile
    if (user) {
      const address = [user.address, user.city, user.state, user.zipCode]
        .filter(Boolean)
        .join(', ');
      setFormData(prev => ({ ...prev, deliveryAddress: address }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.deliveryAddress.trim()) {
        setError('Please enter a delivery address');
        return false;
      }
      if (formData.deliveryAddress.trim().length < 10) {
        setError('Please enter a complete delivery address');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
      setError('');
    }
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        restaurantId,
        items: items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        })),
        deliveryAddress: formData.deliveryAddress,
        deliveryNotes: formData.deliveryNotes,
        paymentMethod: formData.paymentMethod
      };

      const response = await ordersAPI.create(orderData);
      clearCart();
      navigate(`/orders/${response.data.data.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = getSubtotal();
  const deliveryFee = 3.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <button className="back-btn" onClick={() => navigate('/cart')}>
            ← Back to Cart
          </button>
          <h1>Checkout</h1>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="checkout-layout">
          {/* Main Content */}
          <div className="checkout-main">
            {/* Progress Steps */}
            <div className="checkout-progress">
              <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <span className="step-label">Address</span>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <span className="step-label">Payment</span>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <span className="step-label">Confirm</span>
              </div>
            </div>

            {/* Step 1: Delivery Address */}
            {step === 1 && (
              <div className="checkout-step">
                <div className="step-card">
                  <h2 className="step-title">
                    <span className="step-icon">📍</span>
                    Delivery Address
                  </h2>

                  <div className="form-group">
                    <label className="form-label">Full Address *</label>
                    <textarea
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleChange}
                      placeholder="Enter your complete delivery address (House no, Building, Street, Landmark)"
                      className="form-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      name="deliveryNotes"
                      value={formData.deliveryNotes}
                      onChange={handleChange}
                      placeholder="E.g., Ring the doorbell, Leave at door"
                      className="form-input"
                    />
                  </div>

                  <button className="btn btn-primary btn-full" onClick={handleNextStep}>
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="checkout-step">
                <div className="step-card">
                  <h2 className="step-title">
                    <span className="step-icon">💳</span>
                    Payment Method
                  </h2>

                  <div className="payment-options">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.id}
                        className={`payment-option ${formData.paymentMethod === method.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleChange}
                        />
                        <div className="payment-option-content">
                          <span className="payment-icon">{method.icon}</span>
                          <div className="payment-info">
                            <span className="payment-label">{method.label}</span>
                            <span className="payment-desc">{method.description}</span>
                          </div>
                          <span className="payment-check">
                            {formData.paymentMethod === method.id && '✓'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="step-actions">
                    <button className="btn btn-outline" onClick={handlePrevStep}>
                      Back
                    </button>
                    <button className="btn btn-primary" onClick={handleNextStep}>
                      Review Order
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Order Confirmation */}
            {step === 3 && (
              <div className="checkout-step">
                <div className="step-card">
                  <h2 className="step-title">
                    <span className="step-icon">✅</span>
                    Review & Confirm Order
                  </h2>

                  {/* Delivery Address Summary */}
                  <div className="review-section">
                    <div className="review-header">
                      <span>📍 Delivery Address</span>
                      <button className="edit-btn" onClick={() => setStep(1)}>Edit</button>
                    </div>
                    <p className="review-text">{formData.deliveryAddress}</p>
                    {formData.deliveryNotes && (
                      <p className="review-note">📝 {formData.deliveryNotes}</p>
                    )}
                  </div>

                  {/* Payment Method Summary */}
                  <div className="review-section">
                    <div className="review-header">
                      <span>💳 Payment Method</span>
                      <button className="edit-btn" onClick={() => setStep(2)}>Edit</button>
                    </div>
                    <p className="review-text">
                      {PAYMENT_METHODS.find(m => m.id === formData.paymentMethod)?.label}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="review-section">
                    <div className="review-header">
                      <span>🛒 Order Items ({items.length})</span>
                    </div>
                    <div className="review-items">
                      {items.map((item) => (
                        <div key={item.itemId} className="review-item">
                          <span className="item-qty">{item.quantity}x</span>
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="step-actions">
                    <button className="btn btn-outline" onClick={handlePrevStep}>
                      Back
                    </button>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="btn-loading">
                          <span className="spinner-small"></span>
                          Placing Order...
                        </span>
                      ) : (
                        `Place Order • ${formatCurrency(total)}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-restaurant">
                <span className="restaurant-icon">🏪</span>
                <span className="restaurant-name">{restaurantName}</span>
              </div>

              <div className="sidebar-items">
                {items.map((item) => (
                  <div key={item.itemId} className="sidebar-item">
                    <div className="item-info">
                      <span className="item-veg-dot">
                        {item.isVegetarian ? '🟢' : '🔴'}
                      </span>
                      <span className="item-name">{item.name}</span>
                    </div>
                    <div className="item-qty-price">
                      <span className="item-qty">{item.quantity}x</span>
                      <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sidebar-divider"></div>

              <div className="sidebar-bill">
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="bill-row">
                  <span>GST & Charges</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="bill-row bill-total">
                  <span>Grand Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
