/**
 * Assigned Orders Page for Delivery Partner
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deliveryPartnerAPI } from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const DELIVERY_STATUSES = [
  { key: 'Assigned', label: 'Assigned', icon: '📋', description: 'Order assigned to you' },
  { key: 'Accepted', label: 'Accepted', icon: '✅', description: 'You have accepted the order' },
  { key: 'Picked Up', label: 'Picked Up', icon: '🛵', description: 'You have picked up the order' },
  { key: 'On The Way', label: 'On The Way', icon: '🚗', description: 'You are delivering the order' },
  { key: 'Delivered', label: 'Delivered', icon: '🎉', description: 'Order has been delivered' }
];

const AssignedOrders = () => {
  const { id: orderIdParam } = useParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await deliveryPartnerAPI.getMyOrders({ page, limit: 10 });
      setOrders(response.data.data);
      setTotalPages(Math.ceil(response.data.total / 10)); // Adjust based on actual pagination structure
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (orderIdParam) {
      fetchOrderDetails(orderIdParam);
    }
  }, [orderIdParam]);

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await deliveryPartnerAPI.getOrderById(orderId);
      setSelectedOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to accept this order?')) {
      try {
        await deliveryPartnerAPI.acceptOrder(orderId);
        fetchOrders();
        if (selectedOrder?.orderId === orderId) {
          fetchOrderDetails(orderId);
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to accept order');
      }
    }
  };

  const handlePickUpOrder = async (orderId) => {
    if (window.confirm('Are you sure you have picked up the order?')) {
      try {
        await deliveryPartnerAPI.pickUpOrder(orderId);
        fetchOrders();
        if (selectedOrder?.orderId === orderId) {
          fetchOrderDetails(orderId);
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to pick up order');
      }
    }
  };

  const handleOnTheWayOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to mark this order as on the way?')) {
      try {
        await deliveryPartnerAPI.onTheWayOrder(orderId);
        fetchOrders();
        if (selectedOrder?.orderId === orderId) {
          fetchOrderDetails(orderId);
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to mark as on the way');
      }
    }
  };

  const handleDeliveredOrder = async (orderId) => {
    if (window.confirm('Are you sure you have delivered the order?')) {
      try {
        await deliveryPartnerAPI.deliveredOrder(orderId);
        fetchOrders();
        if (selectedOrder?.orderId === orderId) {
          fetchOrderDetails(orderId);
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to mark as delivered');
      }
    }
  };

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

  const canAccept = (status) => status === 'Assigned';
  const canPickUp = (status) => status === 'Accepted';
  const canOnTheWay = (status) => status === 'Picked Up';
  const canDeliver = (status) => status === 'On The Way';

  if (selectedOrder) {
    const statusIndex = getDeliveryStatusIndex(selectedOrder.deliveryStatus);
    return (
      <div className="order-detail-page">
        <div className="container">
          <button className="back-btn" onClick={() => setSelectedOrder(null)}>
            Back to Orders
          </button>
          <div className="order-detail-card">
            <div className="order-detail-header">
              <div className="order-info">
                <h2>Order #{selectedOrder.orderNumber}</h2>
                <p className="order-date">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <span className={`order-status-badge ${getDeliveryStatusClass(selectedOrder.deliveryStatus)}`}>
                {selectedOrder.deliveryStatus}
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
                  <span>{selectedOrder.firstName} {selectedOrder.lastName}</span>
                </div>
                <div className="order-info-item">
                  <span>Restaurant:</span>
                  <span>{selectedOrder.restaurantName}</span>
                </div>
                <div className="order-info-item">
                  <span>Order Total:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="order-info-item">
                  <span>Delivery Address:</span>
                  <span>{selectedOrder.deliveryAddress}</span>
                </div>
                {selectedOrder.deliveryNotes && (
                  <div className="order-info-item">
                    <span>Delivery Notes:</span>
                    <span>{selectedOrder.deliveryNotes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="order-items-section">
              <h3>Order Items</h3>
              <div className="order-items-list">
                {selectedOrder.items?.map((item) => (
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
              {canAccept(selectedOrder.deliveryStatus) && (
                <button className="btn btn-success" onClick={() => handleAcceptOrder(selectedOrder.orderId)}>Accept Order</button>
              )}
              {canPickUp(selectedOrder.deliveryStatus) && (
                <button className="btn btn-warning" onClick={() => handlePickUpOrder(selectedOrder.orderId)}>Pick Up Order</button>
              )}
              {canOnTheWay(selectedOrder.deliveryStatus) && (
                <button className="btn btn-info" onClick={() => handleOnTheWayOrder(selectedOrder.orderId)}>Start Delivery</button>
              )}
              {canDeliver(selectedOrder.deliveryStatus) && (
                <button className="btn btn-success" onClick={() => handleDeliveredOrder(selectedOrder.orderId)}>Mark as Delivered</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-orders-page">
      <div className="container">
        <h1>Assigned Orders</h1>

        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : orders.length === 0 ? (
          <div className="empty-page">
            <div className="empty-content">
              <span className="empty-icon">📦</span>
              <h2>No Assigned Orders</h2>
              <p>You don't have any orders assigned to you yet.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.orderId} className="order-card" onClick={() => fetchOrderDetails(order.orderId)}>
                  <div className="order-card-top">
                    <div className="order-card-header">
                      <div>
                        <span className="order-number">{order.orderNumber}</span>
                        <span className="order-date">{formatDateTime(order.createdAt)}</span>
                      </div>
                      <span className={`order-status-badge ${getDeliveryStatusClass(order.deliveryStatus)}`}>
                        {order.deliveryStatus}
                      </span>
                    </div>
                    <div className="order-restaurant">{order.restaurantName}</div>
                    <div className="order-items-preview">
                      {order.items?.slice(0, 2).map((item) => (
                        <span key={item.orderItemId} className="item-tag">{item.quantity}x {item.itemName}</span>
                      ))}
                      {order.items?.length > 2 && <span className="item-more">+{order.items.length - 2} more</span>}
                    </div>
                  </div>
                  <div className="order-card-footer">
                    <span className="order-total">{formatCurrency(order.total)}</span>
                    <div className="delivery-status">
                      <span className="status-dot"></span>
                      <span>{order.deliveryStatus}</span>
                    </div>
                    <button className="btn btn-outline btn-sm">View Details</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination would go here if needed */}
          </>
        )}
      </div>
    </div>
  );
};

export default AssignedOrders;