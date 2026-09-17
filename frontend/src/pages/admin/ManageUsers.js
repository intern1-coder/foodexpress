import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../api';
import { formatDateTime, capitalize } from '../../utils/helpers';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const response = await usersAPI.getAllUsers(params);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'role-admin',
      owner: 'role-owner',
      customer: 'role-customer'
    };
    return classes[role] || '';
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <p className="page-subtitle">{users.length} users on this page</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="search-input"
          />
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${roleFilter === '' ? 'active' : ''}`}
            onClick={() => { setRoleFilter(''); setPage(1); }}
          >
            All
          </button>
          <button
            className={`filter-tab ${roleFilter === 'customer' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('customer'); setPage(1); }}
          >
            Customers
          </button>
          <button
            className={`filter-tab ${roleFilter === 'owner' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('owner'); setPage(1); }}
          >
            Owners
          </button>
          <button
            className={`filter-tab ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('admin'); setPage(1); }}
          >
            Admins
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3>No users found</h3>
          <p>Users will appear here once they register</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {user.firstName?.charAt(0) || 'U'}
                        </div>
                        <div className="table-cell-primary">{user.firstName} {user.lastName}</div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {capitalize(user.role)}
                      </span>
                    </td>
                    <td>{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
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
    </div>
  );
};

export default ManageUsers;
