import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../api';
import { formatCurrency, formatDateTime, capitalize } from '../../utils/helpers';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const response = await ordersAPI.getAll(params);
      setOrders(response.data.data.orders);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to "${newStatus.replace(/_/g, ' ')}"?`)) {
      return;
    }
    try {
      setUpdatingStatus(orderId);
      await ordersAPI.updateStatus(orderId, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < 0 || currentIndex >= statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1];
  };

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

  const viewOrderDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <p className="page-subtitle">{orders.length} orders on this page</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="search-input"
          />
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            All
          </button>
          <button
            className={`filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
          >
            Pending
          </button>
          <button
            className={`filter-tab ${statusFilter === 'confirmed' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('confirmed'); setPage(1); }}
          >
            Confirmed
          </button>
          <button
            className={`filter-tab ${statusFilter === 'preparing' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('preparing'); setPage(1); }}
          >
            Preparing
          </button>
          <button
            className={`filter-tab ${statusFilter === 'out_for_delivery' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('out_for_delivery'); setPage(1); }}
          >
            Out for Delivery
          </button>
          <button
            className={`filter-tab ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('delivered'); setPage(1); }}
          >
            Delivered
          </button>
          <button
            className={`filter-tab ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('cancelled'); setPage(1); }}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No orders found</h3>
          <p>Orders will appear here once customers start ordering</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <tr key={order.orderId}>
                      <td><strong>{order.orderNumber}</strong></td>
                      <td>
                        <div className="table-cell-primary">{order.firstName} {order.lastName}</div>
                        <div className="table-cell-secondary">{order.phone}</div>
                      </td>
                      <td>{order.restaurantName}</td>
                      <td>{order.itemCount || 0} items</td>
                      <td><strong>{formatCurrency(order.total)}</strong></td>
                      <td>
                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                          {capitalize(order.status.replace(/_/g, ' '))}
                        </span>
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-sm btn-outline" onClick={() => viewOrderDetail(order)}>
                            View
                          </button>
                          {nextStatus && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleStatusChange(order.orderId, nextStatus)}
                              disabled={updatingStatus === order.orderId}
                            >
                              {updatingStatus === order.orderId ? '...' : `Mark ${capitalize(nextStatus.replace(/_/g, ' '))}`}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {detailModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.orderNumber}</h2>
              <button className="modal-close" onClick={closeDetailModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="order-detail-grid">
                <div className="detail-section">
                  <h4>Customer Info</h4>
                  <p><strong>Name:</strong> {selectedOrder.firstName} {selectedOrder.lastName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                  <p><strong>Email:</strong> {selectedOrder.email}</p>
                  <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                </div>

                <div className="detail-section">
                  <h4>Restaurant</h4>
                  <p><strong>{selectedOrder.restaurantName}</strong></p>
                </div>

                <div className="detail-section">
                  <h4>Status</h4>
                  <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                    {capitalize(selectedOrder.status.replace(/_/g, ' '))}
                  </span>
                  <div className="status-update-section">
                    <label>Update Status:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleStatusChange(selectedOrder.orderId, e.target.value);
                        e.target.value = '';
                      }}
                      className="form-select"
                      defaultValue=""
                    >
                      <option value="" disabled>Select new status</option>
                      {statusOptions
                        .filter(opt => opt.value !== selectedOrder.status && opt.value !== 'pending')
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Order Summary</h4>
                  <p><strong>Subtotal:</strong> {formatCurrency(selectedOrder.subtotal)}</p>
                  <p><strong>Tax:</strong> {formatCurrency(selectedOrder.tax)}</p>
                  <p><strong>Delivery Fee:</strong> {formatCurrency(selectedOrder.deliveryFee)}</p>
                  <p><strong>Total:</strong> <strong>{formatCurrency(selectedOrder.total)}</strong></p>
                  <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
                </div>

                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedOrder.specialInstructions || 'No special instructions'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
