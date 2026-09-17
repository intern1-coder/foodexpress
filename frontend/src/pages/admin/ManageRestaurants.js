import React, { useState, useEffect } from 'react';
import { restaurantsAPI } from '../../api';
import { formatDateTime, capitalize } from '../../utils/helpers';

const initialFormData = {
  name: '',
  description: '',
  cuisineType: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  openingTime: '09:00',
  closingTime: '22:00',
  deliveryFee: '0',
  minimumOrder: '0',
  estimatedDeliveryTime: '30'
};

const ManageRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRestaurants();
  }, [page, search]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await restaurantsAPI.getAll({ page, limit: 10, search });
      setRestaurants(response.data.data.restaurants);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (restaurant = null) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setFormData({
        name: restaurant.name,
        description: restaurant.description || '',
        cuisineType: restaurant.cuisineType,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        zipCode: restaurant.zipCode || '',
        phone: restaurant.phone,
        email: restaurant.email || '',
        openingTime: restaurant.openingTime?.substring(0, 5) || '09:00',
        closingTime: restaurant.closingTime?.substring(0, 5) || '22:00',
        deliveryFee: restaurant.deliveryFee.toString(),
        minimumOrder: restaurant.minimumOrder.toString(),
        estimatedDeliveryTime: restaurant.estimatedDeliveryTime.toString()
      });
    } else {
      setEditingRestaurant(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRestaurant(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.cuisineType.trim()) errors.cuisineType = 'Cuisine type is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.openingTime) errors.openingTime = 'Opening time is required';
    if (!formData.closingTime) errors.closingTime = 'Closing time is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data = {
        ...formData,
        deliveryFee: parseFloat(formData.deliveryFee) || 0,
        minimumOrder: parseFloat(formData.minimumOrder) || 0,
        estimatedDeliveryTime: parseInt(formData.estimatedDeliveryTime) || 30
      };

      if (editingRestaurant) {
        await restaurantsAPI.update(editingRestaurant.restaurantId, data);
      } else {
        await restaurantsAPI.create(data);
      }
      handleCloseModal();
      fetchRestaurants();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Failed to save restaurant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await restaurantsAPI.delete(id);
        fetchRestaurants();
      } catch (error) {
        console.error('Error:', error);
        alert(error.response?.data?.message || 'Failed to delete restaurant');
      }
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <p className="page-subtitle">{restaurants.length} restaurants total</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Restaurant
        </button>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="search-input"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏪</span>
          <h3>No restaurants found</h3>
          <p>Add your first restaurant to get started</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>Add Restaurant</button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Cuisine</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.restaurantId}>
                    <td>
                      <div className="table-cell-primary">{restaurant.name}</div>
                      <div className="table-cell-secondary">{restaurant.phone}</div>
                    </td>
                    <td><span className="cuisine-tag">{restaurant.cuisineType}</span></td>
                    <td>
                      <div className="table-cell-primary">{restaurant.city}</div>
                      <div className="table-cell-secondary">{restaurant.state}</div>
                    </td>
                    <td>
                      <span className="rating-badge">★ {restaurant.rating}</span>
                    </td>
                    <td>
                      <span className={`status-dot ${restaurant.isActive ? 'active' : 'inactive'}`}></span>
                      {restaurant.isActive ? 'Active' : 'Inactive'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-outline" onClick={() => handleOpenModal(restaurant)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(restaurant.restaurantId, restaurant.name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`form-input ${formErrors.name ? 'error' : ''}`} />
                    {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cuisine Type *</label>
                    <input type="text" name="cuisineType" value={formData.cuisineType} onChange={handleChange} className={`form-input ${formErrors.cuisineType ? 'error' : ''}`} placeholder="e.g., Italian, Chinese" />
                    {formErrors.cuisineType && <span className="form-error">{formErrors.cuisineType}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows={2} />
                </div>

                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={`form-input ${formErrors.address ? 'error' : ''}`} />
                  {formErrors.address && <span className="form-error">{formErrors.address}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={`form-input ${formErrors.city ? 'error' : ''}`} />
                    {formErrors.city && <span className="form-error">{formErrors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} className={`form-input ${formErrors.state ? 'error' : ''}`} />
                    {formErrors.state && <span className="form-error">{formErrors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="form-input" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={`form-input ${formErrors.phone ? 'error' : ''}`} />
                    {formErrors.phone && <span className="form-error">{formErrors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Opening Time *</label>
                    <input type="time" name="openingTime" value={formData.openingTime} onChange={handleChange} className={`form-input ${formErrors.openingTime ? 'error' : ''}`} />
                    {formErrors.openingTime && <span className="form-error">{formErrors.openingTime}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Closing Time *</label>
                    <input type="time" name="closingTime" value={formData.closingTime} onChange={handleChange} className={`form-input ${formErrors.closingTime ? 'error' : ''}`} />
                    {formErrors.closingTime && <span className="form-error">{formErrors.closingTime}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Delivery Fee ($)</label>
                    <input type="number" name="deliveryFee" value={formData.deliveryFee} onChange={handleChange} className="form-input" step="0.01" min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Minimum Order ($)</label>
                    <input type="number" name="minimumOrder" value={formData.minimumOrder} onChange={handleChange} className="form-input" step="0.01" min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Est. Delivery (min)</label>
                    <input type="number" name="estimatedDeliveryTime" value={formData.estimatedDeliveryTime} onChange={handleChange} className="form-input" min="1" />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingRestaurant ? 'Update Restaurant' : 'Create Restaurant')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRestaurants;
