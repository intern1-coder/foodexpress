/**
 * Delivery Partner Dashboard Page
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context';
import { deliveryPartnerAPI } from '../../api';
import { Card, StatBox, LoadingSpinner, ErrorMessage } from '../../components/ui';

const DeliveryDashboard = () => {
  const { user, isDeliveryPartner } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await deliveryPartnerAPI.getDashboard();
        setDashboardData(response.data.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (isDeliveryPartner) {
      fetchDashboard();
    }
  }, [isDeliveryPartner]);

  if (!isDeliveryPartner) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-card">
            <h1>Access Denied</h1>
            <p>You do not have permission to access the delivery partner dashboard.</p>
            <a href="/" className="btn btn-secondary">
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-card">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-card">
            <ErrorMessage message={error} />
          </div>
        </div>
      </div>
    );
  }

  const { deliveryPartner, stats } = dashboardData || {};

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Delivery Partner Dashboard</h1>
          <p>Welcome back, {deliveryPartner?.firstName} {deliveryPartner?.lastName}!</p>
        </div>

        <div className="stats-grid">
          <StatBox title="Active Deliveries" value={stats?.activeDeliveries || 0} icon="truck" color="blue" />
          <StatBox title="Completed Deliveries" value={stats?.completedDeliveries || 0} icon="check-circle" color="green" />
          <StatBox title="Total Deliveries" value={stats?.totalDeliveries || 0} icon="list" color="purple" />
          <StatBox title="Availability" value={deliveryPartner?.isAvailable ? 'Available' : 'Unavailable'} icon={deliveryPartner?.isAvailable ? 'check-circle' : 'ban'} color={deliveryPartner?.isAvailable ? 'green' : 'red'} />
        </div>

        <div className="dashboard-footer">
          <a href="/delivery/orders" className="btn btn-primary">
            View Assigned Orders
          </a>
          <a href="/delivery/profile" className="btn btn-secondary">
            Edit Profile
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;