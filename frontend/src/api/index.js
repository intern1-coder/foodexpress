/**
 * API Services
 *
 * Organized API calls by domain
 */

import api from './axios';

// ============================================
// Auth API
// ============================================
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  refreshToken: () => api.post('/api/auth/refresh')
};

// ============================================
// Users API
// ============================================
export const usersAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  deleteAccount: () => api.delete('/api/users/profile'),
  getAllUsers: (params) => api.get('/api/users', { params })
};

// ============================================
// Restaurants API
// ============================================
export const restaurantsAPI = {
  getAll: (params) => api.get('/api/restaurants', { params }),
  getById: (id) => api.get(`/api/restaurants/${id}`),
  getMenu: (id) => api.get(`/api/restaurants/${id}/menu`),
  create: (data) => api.post('/api/restaurants', data),
  update: (id, data) => api.put(`/api/restaurants/${id}`, data),
  delete: (id) => api.delete(`/api/restaurants/${id}`)
};

// ============================================
// Food Items API
// ============================================
export const foodsAPI = {
  getAll: (params) => api.get('/api/foods', { params }),
  getById: (id) => api.get(`/api/foods/${id}`),
  getByRestaurant: (restaurantId, params) =>
    api.get(`/api/restaurants/${restaurantId}/foods`, { params }),
  create: (data) => api.post('/api/foods', data),
  update: (id, data) => api.put(`/api/foods/${id}`, data),
  delete: (id) => api.delete(`/api/foods/${id}`)
};

// ============================================
// Orders API
// ============================================
export const ordersAPI = {
  create: (data) => api.post('/api/orders', data),
  getMyOrders: (params) => api.get('/api/orders', { params }),
  getById: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, data) => api.put(`/api/orders/${id}/status`, data),
  cancel: (id) => api.put(`/api/orders/${id}/cancel`),
  getAll: (params) => api.get('/api/orders/all', { params }),
  getStats: (params) => api.get('/api/orders/stats', { params })
};

// ============================================
// Delivery Partner API
// ============================================
export const deliveryPartnerAPI = {
  login: (data) => api.post('/api/delivery/login', data),
  getDashboard: () => api.get('/api/delivery/dashboard'),
  getMyOrders: (params) => api.get('/api/delivery/orders', { params }),
  getOrderById: (id) => api.get(`/api/delivery/orders/${id}`),
  acceptOrder: (id) => api.put(`/api/delivery/orders/${id}/accept`),
  pickUpOrder: (id) => api.put(`/api/delivery/orders/${id}/pickup`),
  onTheWayOrder: (id) => api.put(`/api/delivery/orders/${id}/on-the-way`),
  deliveredOrder: (id) => api.put(`/api/delivery/orders/${id}/delivered`),
  getProfile: () => api.get('/api/delivery/profile'),
  updateProfile: (data) => api.put('/api/delivery/profile', data)
};

// ============================================
// Admin Delivery Partner API
// ============================================
export const adminDeliveryPartnerAPI = {
  getAll: (params) => api.get('/api/admin/delivery-partners', { params }),
  getById: (id) => api.get(`/api/admin/delivery-partners/${id}`),
  create: (data) => api.post('/api/admin/delivery-partners', data),
  update: (id, data) => api.put(`/api/admin/delivery-partners/${id}`, data),
  delete: (id) => api.delete(`/api/admin/delivery-partners/${id}`),
  assignToOrder: (orderId, data) => api.put(`/api/admin/orders/${orderId}/assign-delivery-partner`, data)
};

export default api;
