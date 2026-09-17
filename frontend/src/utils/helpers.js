/**
 * Utility Functions
 */

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date and time
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (text && text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

// Generate order status color
export const getStatusColor = (status) => {
  const colors = {
    pending: '#ffc107',
    confirmed: '#17a2b8',
    preparing: '#fd7e14',
    ready: '#6f42c1',
    out_for_delivery: '#20c997',
    delivered: '#28a745',
    cancelled: '#dc3545'
  };
  return colors[status] || '#6c757d';
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};
