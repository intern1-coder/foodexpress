import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/layout';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const titles = {
      '/admin': 'Dashboard',
      '/admin/restaurants': 'Manage Restaurants',
      '/admin/foods': 'Manage Food Items',
      '/admin/orders': 'Manage Orders',
      '/admin/users': 'Manage Users'
    };
    return titles[location.pathname] || 'Admin';
  };

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="admin-main">
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <h1 className="page-title">{getPageTitle()}</h1>
          <div className="admin-header-right">
            <span className="admin-badge">Admin</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
