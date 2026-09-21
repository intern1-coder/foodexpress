// Utility functions for the frontend application

const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Get user role from localStorage
const getUserRole = () => {
  return localStorage.getItem('userRole');
};

// Get user data from localStorage
const getUserData = () => {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
};

// Save user data to localStorage
const saveUserData = (user, token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userRole', user.role);
};

// Clear user data from localStorage
const clearUserData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
};

// Make authenticated API request
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headers
  });

  // Handle 401 Unauthorized (token expired or invalid)
  if (response.status === 401) {
    clearUserData();
    // Redirect to auth page
    window.location.href = '../index.html';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'An error occurred');
  }

  return response.json();
};

// Helper functions for DOM manipulation
const createElement = (tag, className, innerHTML = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Format time
const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Show loading state
const showLoading = (element) => {
  element.innerHTML = '<div class="loading">Loading...</div>';
};

// Show error state
const showError = (element, message) => {
  element.innerHTML = `<div class="error">${message}</div>`;
};

// Show empty state
const showEmpty = (element, message) => {
  element.innerHTML = `<div class="empty-state">
    <i class="fas fa-info-circle"></i>
    <p>${message}</p>
  </div>`;
};

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Auth check middleware
const requireAuth = (requiredRole = null) => {
  const token = getToken();
  const userRole = getUserRole();

  if (!token) {
    window.location.href = '../index.html';
    return false;
  }

  if (requiredRole && userRole !== requiredRole) {
    window.location.href = '../index.html';
    return false;
  }

  return true;
};

export {
  API_BASE_URL,
  getToken,
  getUserRole,
  getUserData,
  saveUserData,
  clearUserData,
  apiRequest,
  createElement,
  formatCurrency,
  formatDate,
  formatTime,
  showLoading,
  showError,
  showEmpty,
  debounce,
  requireAuth
};