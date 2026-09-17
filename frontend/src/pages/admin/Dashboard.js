import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, restaurantsAPI, usersAPI } from '../../api';
import { formatCurrency, formatDateTime, capitalize } from '../../utils/helpers';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [restaurantCount, setRestaurantCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, restaurantsRes, usersRes] = await Promise.all([
        ordersAPI.getStats(),
        ordersAPI.getAll({ limit: 5 }),
        restaurantsAPI.getAll({ limit: 1 }),
        usersAPI.getAllUsers({ limit: 1 })
      ]);

      setStats(statsRes.data.data.stats);
      setRecentOrders(ordersRes.data.data.orders);
      setRestaurantCount(restaurantsRes.data.data.pagination.totalCount);
      setUserCount(usersRes.data.data.pagination.totalCount);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: '📦',
      color: '#ff6b35',
      link: '/admin/orders'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: '💰',
      color: '#28a745',
      link: '/admin/orders'
    },
    {
      title: 'Restaurants',
      value: restaurantCount,
      icon: '🏪',
      color: '#004e89',
      link: '/admin/restaurants'
    },
    {
      title: 'Users',
      value: userCount,
      icon: '👥',
      color: '#6f42c1',
      link: '/admin/users'
    }
  ];

  const orderStats = [
    { label: 'Pending', value: stats?.pendingOrders || 0, icon: '⏳', color: '#ffc107' },
    { label: 'Confirmed', value: stats?.confirmedOrders || 0, icon: '✅', color: '#17a2b8' },
    { label: 'Preparing', value: stats?.preparingOrders || 0, icon: '👨‍🍳', color: '#fd7e14' },
    { label: 'Out for Delivery', value: stats?.outForDeliveryOrders || 0, icon: '🛵', color: '#20c997' },
    { label: 'Delivered', value: stats?.deliveredOrders || 0, icon: '🎉', color: '#28a745' },
    { label: 'Cancelled', value: stats?.cancelledOrders || 0, icon: '❌', color: '#dc3545' }
  ];

  return (
    <div className="admin-dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link} className="stat-card-link">
            <div className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
              <div className="stat-card-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-card-content">
                <span className="stat-card-value">{stat.value}</span>
                <span className="stat-card-title">{stat.title}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Order Status Overview */}
      <div className="dashboard-section">
        <h2 className="section-heading">Order Status Overview</h2>
        <div className="order-status-grid">
          {orderStats.map((stat, index) => (
            <div key={index} className="order-status-card">
              <div className="status-card-icon" style={{ color: stat.color }}>{stat.icon}</div>
              <div className="status-card-value">{stat.value}</div>
              <div className="status-card-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/admin/restaurants" className="quick-action-card">
            <span className="action-icon">🏪</span>
            <span className="action-label">Add Restaurant</span>
          </Link>
          <Link to="/admin/foods" className="quick-action-card">
            <span className="action-icon">🍕</span>
            <span className="action-label">Add Food Item</span>
          </Link>
          <Link to="/admin/orders" className="quick-action-card">
            <span className="action-icon">📦</span>
            <span className="action-label">View Orders</span>
          </Link>
          <Link to="/admin/users" className="quick-action-card">
            <span className="action-icon">👥</span>
            <span className="action-label">View Users</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-heading">Recent Orders</h2>
          <Link to="/admin/orders" className="btn btn-outline btn-sm">View All</Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table">No orders found</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td><strong>{order.orderNumber}</strong></td>
                    <td>{order.firstName} {order.lastName}</td>
                    <td>{order.restaurantName}</td>
                    <td><strong>{formatCurrency(order.total)}</strong></td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {capitalize(order.status.replace(/_/g, ' '))}
                      </span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
