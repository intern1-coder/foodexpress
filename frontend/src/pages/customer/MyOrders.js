import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersAPI } from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: '📋', description: 'Your order has been placed' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅', description: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', description: 'Your food is being prepared' },
  { key: 'ready', label: 'Ready', icon: '📦', description: 'Your order is ready for pickup' },
  { key: 'out_for_delivery', label: 'On the Way', icon: '🛵', description: 'Your order is on the way' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', description: 'Your order has been delivered' }
];

const MyOrders = () => {
  const { id: orderIdParam } = useParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getMyOrders({ page, limit: 10 });
      setOrders(response.data.data.orders);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      const response = await ordersAPI.getById(orderId);
      setSelectedOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await ordersAPI.cancel(orderId);
        fetchOrders();
        if (selectedOrder?.orderId === orderId) {
          fetchOrderDetails(orderId);
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  const getStatusIndex = (status) => ORDER_STATUSES.findIndex(s => s.key === status);

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      preparing: 'status-preparing',
      ready: 'status-ready',
      out_for_delivery: 'status-delivery',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };
    return classes[status] || '';
  };

  const canCancel = (status) => ['pending', 'confirmed'].includes(status);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' }
  ];

  const filterOrdersByTab = (list) => {
    switch (activeTab) {
      case 'active':
        return list.filter(o => !['delivered', 'cancelled'].includes(o.status));
      case 'completed':
        return list.filter(o => o.status === 'delivered');
      default:
        return list;
    }
  };

  const filteredOrders = filterOrdersByTab(orders);

  if (selectedOrder) {
    const statusIndex = getStatusIndex(selectedOrder.status);
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
              <span className={`order-status-badge ${getStatusClass(selectedOrder.status)}`}>
                {selectedOrder.status === 'out_for_delivery' ? 'On the Way' : selectedOrder.status.replace(/_/g, ' ')}
              </span>
            </div>

            {selectedOrder.status !== 'cancelled' && (
              <div className="status-tracker">
                {ORDER_STATUSES.map((status, index) => (
                  <div key={status.key} className={`tracker-step ${index <= statusIndex ? 'completed' : ''} ${index === statusIndex ? 'current' : ''}`}>
                    <div className="tracker-icon">{index < statusIndex ? '✓' : status.icon}</div>
                    <div className="tracker-info">
                      <span className="tracker-label">{status.label}</span>
                      <span className="tracker-desc">{status.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedOrder.status === 'cancelled' && (
              <div className="cancelled-notice">
                <span className="notice-icon">❌</span>
                <div><h4>Order Cancelled</h4><p>This order has been cancelled</p></div>
              </div>
            )}

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

            <div className="bill-section">
              <h3>Bill Details</h3>
              <div className="bill-rows">
                <div className="bill-row"><span>Item Total</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                <div className="bill-row"><span>Delivery Fee</span><span>{formatCurrency(selectedOrder.deliveryFee)}</span></div>
                <div className="bill-row"><span>GST & Charges</span><span>{formatCurrency(selectedOrder.tax)}</span></div>
                <div className="bill-row bill-total"><span>Total Paid</span><span>{formatCurrency(selectedOrder.total)}</span></div>
              </div>
            </div>

            <div className="delivery-section">
              <h3>Delivery Details</h3>
              <div className="delivery-info">
                <div className="delivery-row">
                  <span className="delivery-icon">📍</span>
                  <div><span className="delivery-label">Delivery Address</span><span className="delivery-text">{selectedOrder.deliveryAddress}</span></div>
                </div>
                {selectedOrder.deliveryNotes && (
                  <div className="delivery-row">
                    <span className="delivery-icon">📝</span>
                    <div><span className="delivery-label">Delivery Instructions</span><span className="delivery-text">{selectedOrder.deliveryNotes}</span></div>
                  </div>
                )}
                <div className="delivery-row">
                  <span className="delivery-icon">💳</span>
                  <div><span className="delivery-label">Payment Method</span><span className="delivery-text">{selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : selectedOrder.paymentMethod}</span></div>
                </div>
              </div>
            </div>

            <div className="order-actions">
              {canCancel(selectedOrder.status) && (
                <button className="btn btn-danger" onClick={() => handleCancelOrder(selectedOrder.orderId)}>Cancel Order</button>
              )}
              <Link to="/restaurants" className="btn btn-primary">Order Again</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1>My Orders</h1>

        <div className="orders-tabs">
          {tabs.map((tab) => (
            <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-page">
            <div className="empty-content">
              <span className="empty-icon">📦</span>
              <h2>No Orders Found</h2>
              <p>{activeTab === 'all' ? "You haven't placed any orders yet" : `No ${activeTab} orders found`}</p>
              <Link to="/restaurants" className="btn btn-primary">Browse Restaurants</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <div key={order.orderId} className="order-card" onClick={() => fetchOrderDetails(order.orderId)}>
                  <div className="order-card-top">
                    <div className="order-card-header">
                      <div>
                        <span className="order-number">{order.orderNumber}</span>
                        <span className="order-date">{formatDateTime(order.createdAt)}</span>
                      </div>
                      <span className={`order-status-badge ${getStatusClass(order.status)}`}>
                        {order.status === 'out_for_delivery' ? 'On the Way' : order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="order-restaurant">{order.restaurantName}</div>
                    <div className="order-items-preview">
                      {order.items?.slice(0, 3).map((item) => (
                        <span key={item.orderItemId} className="item-tag">{item.quantity}x {item.itemName}</span>
                      ))}
                      {order.items?.length > 3 && <span className="item-more">+{order.items.length - 3} more</span>}
                    </div>
                  </div>
                  <div className="order-card-footer">
                    <span className="order-total">{formatCurrency(order.total)}</span>
                    <button className="btn btn-outline btn-sm">View Details</button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
