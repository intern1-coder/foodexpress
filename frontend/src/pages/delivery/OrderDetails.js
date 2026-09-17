/**
 * Order Details Page for Delivery Partner
 */

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { deliveryPartnerAPI } from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const DELIVERY_STATUSES = [
  { key: 'Assigned', label: 'Assigned', icon: '📋', description: 'Order assigned to you' },
  { key: 'Accepted', label: 'Accepted', icon: '✅', description: 'You have accepted the order' },
  { key: 'Picked Up', label: 'Picked Up', icon: '🛵', description: 'You have picked up the order' },
  { key: 'On The Way', label: 'On The Way', icon: '🚗', description: 'You are delivering the order' },
  { key: 'Delivered', label: 'Delivered', icon: '🎉', description: 'Order has been delivered' }
];

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await deliveryPartnerAPI.getOrderById(id);
        setOrder(response.data.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="error-message">
            <p>{error}</p>
            <Link to="/delivery/orders" className="btn btn-outline">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="error-message">
            <p>Order not found</p>
            <Link to="/delivery/orders" className="btn btn-outline">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getDeliveryStatusIndex = (status) => DELIVERY_STATUSES.findIndex(s => s.key === status);
  const getDeliveryStatusClass = (status) => {
    const classes = {
      Assigned: 'status-assigned',
      Accepted: 'status-accepted',
      'Picked Up': 'status-pickup',
      'On The Way': 'status-ontheway',
      Delivered: 'status-delivered'
    };
    return classes[status] || '';
  };

  const statusIndex = getDeliveryStatusIndex(order.deliveryStatus);
  const canAccept = order.deliveryStatus === 'Assigned';
  const canPickUp = order.deliveryStatus === 'Accepted';
  const canOnTheWay = order.deliveryStatus === 'Picked Up';
  const canDeliver = order.deliveryStatus === 'On The Way';

  const handleAcceptOrder = async () => {
    if (window.confirm('Are you sure you want to accept this order?')) {
      try {
        await deliveryPartnerAPI.acceptOrder(id);
        // Refetch order to update status
        const response = await deliveryPartnerAPI.getOrderById(id);
        setOrder(response.data.data);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to accept order');
      }
    }
  };

  const handlePickUpOrder = async () => {
    if (window.confirm('Are you sure you have picked up the order?')) {
      try {
        await deliveryPartnerAPI.pickUpOrder(id);
        const response = await deliveryPartnerAPI.getOrderById(id);
        setOrder(response.data.data);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to pick up order');
      }
    }
  };

  const handleOnTheWayOrder = async () => {
    if (window.confirm('Are you sure you want to mark this order as on the way?')) {
      try {
        await deliveryPartnerAPI.onTheWayOrder(id);
        const response = await deliveryPartnerAPI.getOrderById(id);
        setOrder(response.data.data);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to mark as on the way');
      }
    }
  };

  const handleDeliveredOrder = async () => {
    if (window.confirm('Are you sure you have delivered the order?')) {
      try {
        await deliveryPartnerAPI.deliveredOrder(id);
        const response = await deliveryPartnerAPI.getOrderById(id);
        setOrder(response.data.data);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to mark as delivered');
      }
    }
  };

  return (
    <div className="order-detail-page">
      <div className="container">
        <div className="order-detail-header">
          <Link to="/delivery/orders" className="back-link">
            ← Back to Assigned Orders
          </Link>
          <h1>Order #{order.orderNumber}</h1>
        </div>

        <div className="order-detail-card">
          <div className="order-detail-header">
            <div className="order-info">
              <h2>Order #{order.orderNumber}</h2>
              <p className="order-date">{formatDateTime(order.createdAt)}</p>
            </div>
            <span className={`order-status-badge ${getDeliveryStatusClass(order.deliveryStatus)}`}>
              {order.deliveryStatus}
            </span>
          </div>

          <div className="delivery-status-tracker">
            {DELIVERY_STATUSES.map((status, index) => (
              <div key={status.key} className={`tracker-step ${index <= statusIndex ? 'completed' : ''} ${index === statusIndex ? 'current' : ''}`}>
                <div className="tracker-icon">{index < statusIndex ? '✓' : status.icon}</div>
                <div className="tracker-info">
                  <span className="tracker-label">{status.label}</span>
                  <span className="tracker-desc">{status.description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="order-details-section">
            <h3>Order Details</h3>
            <div className="order-info-grid">
              <div className="order-info-item">
                <span>Customer:</span>
                <span>{order.firstName} {order.lastName}</span>
              </div>
              <div className="order-info-item">
                <span>Restaurant:</span>
                <span>{order.restaurantName}</span>
              </div>
              <div className="order-info-item">
                <span>Order Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="order-info-item">
                <span>Delivery Address:</span>
                <span>{order.deliveryAddress}</span>
              </div>
              {order.deliveryNotes && (
                <div className="order-info-item">
                  <span>Delivery Notes:</span>
                  <span>{order.deliveryNotes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="order-items-section">
            <h3>Order Items</h3>
            <div className="order-items-list">
              {order.items?.map((item) => (
                <div key={item.orderItemId} className="order-item">
                  <div className="item-info">
                    <span className="item-qty">{item.quantity}x</span>
                    <div className="item-details">
                      <span className="item-name">{item.itemName}</span>
                      {item.specialInstructions && <span className="item-note">📝 {item.specialInstructions}</span>}
                    </div>
                  </div>
                  <span className="item-price">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="delivery-actions">
            {canAccept && (
              <button className="btn btn-success" onClick={handleAcceptOrder}>
                Accept Order
              </button>
            )}
            {canPickUp && (
              <button className="btn btn-warning" onClick={handlePickUpOrder}>
                Pick Up Order
              </button>
            )}
            {canOnTheWay && (
              <button className="btn btn-info" onClick={handleOnTheWayOrder}>
                Start Delivery
              </button>
            )}
            {canDeliver && (
              <button className="btn btn-success" onClick={handleDeliveredOrder}>
                Mark as Delivered
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;