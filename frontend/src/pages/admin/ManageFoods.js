import React, { useState, useEffect } from 'react';
import { foodsAPI, restaurantsAPI } from '../../api';
import { formatCurrency } from '../../utils/helpers';

const initialFormData = {
  restaurantId: '',
  name: '',
  description: '',
  price: '',
  category: '',
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  preparationTime: '15',
  calories: ''
};

const ManageFoods = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchFoodItems();
  }, [page, search, restaurantFilter]);

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantsAPI.getAll({ limit: 100 });
      setRestaurants(response.data.data.restaurants);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (restaurantFilter) params.restaurantId = restaurantFilter;
      const response = await foodsAPI.getAll(params);
      setFoodItems(response.data.data.foodItems);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        restaurantId: item.restaurantId,
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        isGlutenFree: item.isGlutenFree,
        preparationTime: item.preparationTime?.toString() || '15',
        calories: item.calories?.toString() || ''
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.restaurantId) errors.restaurantId = 'Restaurant is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime) || 15,
        calories: formData.calories ? parseInt(formData.calories) : null
      };

      if (editingItem) {
        await foodsAPI.update(editingItem.itemId, data);
      } else {
        await foodsAPI.create(data);
      }
      handleCloseModal();
      fetchFoodItems();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Failed to save food item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await foodsAPI.delete(id);
        fetchFoodItems();
      } catch (error) {
        console.error('Error:', error);
        alert(error.response?.data?.message || 'Failed to delete food item');
      }
    }
  };

  const getRestaurantName = (id) => {
    const restaurant = restaurants.find(r => r.restaurantId === id);
    return restaurant?.name || 'Unknown';
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-left">
          <p className="page-subtitle">{foodItems.length} food items total</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add Food Item</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search food items..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        </div>
        <select value={restaurantFilter} onChange={(e) => { setRestaurantFilter(e.target.value); setPage(1); }} className="filter-select">
          <option value="">All Restaurants</option>
          {restaurants.map((r) => (
            <option key={r.restaurantId} value={r.restaurantId}>{r.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : foodItems.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🍕</span>
          <h3>No food items found</h3>
          <p>Add your first food item to get started</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>Add Food Item</button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Restaurant</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Dietary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {foodItems.map((item) => (
                  <tr key={item.itemId}>
                    <td>
                      <div className="table-cell-primary">{item.name}</div>
                      <div className="table-cell-secondary">{item.description?.substring(0, 50)}...</div>
                    </td>
                    <td>{item.restaurantName || getRestaurantName(item.restaurantId)}</td>
                    <td><span className="category-tag">{item.category}</span></td>
                    <td><strong>{formatCurrency(item.price)}</strong></td>
                    <td>
                      <div className="dietary-badges">
                        {item.isVegetarian && <span className="dietary-badge veg">Veg</span>}
                        {item.isVegan && <span className="dietary-badge vegan">Vegan</span>}
                        {item.isGlutenFree && <span className="dietary-badge gf">GF</span>}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-outline" onClick={() => handleOpenModal(item)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.itemId, item.name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Food Item' : 'Add Food Item'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Restaurant *</label>
                  <select name="restaurantId" value={formData.restaurantId} onChange={handleChange} className={`form-select ${formErrors.restaurantId ? 'error' : ''}`}>
                    <option value="">Select Restaurant</option>
                    {restaurants.map((r) => (
                      <option key={r.restaurantId} value={r.restaurantId}>{r.name}</option>
                    ))}
                  </select>
                  {formErrors.restaurantId && <span className="form-error">{formErrors.restaurantId}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`form-input ${formErrors.name ? 'error' : ''}`} />
                    {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} className={`form-input ${formErrors.category ? 'error' : ''}`} placeholder="e.g., Pizza, Main Course" />
                    {formErrors.category && <span className="form-error">{formErrors.category}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows={2} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price ($) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className={`form-input ${formErrors.price ? 'error' : ''}`} step="0.01" min="0.01" />
                    {formErrors.price && <span className="form-error">{formErrors.price}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preparation Time (min)</label>
                    <input type="number" name="preparationTime" value={formData.preparationTime} onChange={handleChange} className="form-input" min="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Calories</label>
                    <input type="number" name="calories" value={formData.calories} onChange={handleChange} className="form-input" min="0" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dietary Options</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" name="isVegetarian" checked={formData.isVegetarian} onChange={handleChange} />
                      <span>Vegetarian</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="isVegan" checked={formData.isVegan} onChange={handleChange} />
                      <span>Vegan</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="isGlutenFree" checked={formData.isGlutenFree} onChange={handleChange} />
                      <span>Gluten Free</span>
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingItem ? 'Update Item' : 'Create Item')}
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

export default ManageFoods;
