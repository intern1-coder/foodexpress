// Restaurant admin portal logic
import {
  apiRequest, getUserData, clearUserData, requireAuth,
  formatCurrency, formatDate, showLoading, showError, showEmpty
} from '../../assets/js/utils.js';

let currentUser = null;
let restaurant = null;
let assignOrderId = null;
let selectedPartnerId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('restaurant_admin')) return;

  currentUser = getUserData();
  if (currentUser) {
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}!`;
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-address').value = currentUser.address || '';
  }

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearUserData();
    window.location.href = '../index.html';
  });

  // Tabs
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const tabId = button.id.replace('-btn', '');
      tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
      loadTabContent(tabId);
    });
  });

  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close).style.display = 'none';
    });
  });
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
  });

  // Add menu item
  const addMenuModal = document.getElementById('add-menu-modal');
  document.getElementById('add-menu-item-btn').addEventListener('click', () => {
    addMenuModal.style.display = 'block';
  });
  document.getElementById('add-menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!restaurant) return alert('Create your restaurant first');
    const menuData = {
      name: document.getElementById('menu-name').value,
      description: document.getElementById('menu-description').value,
      price: parseFloat(document.getElementById('menu-price').value),
      category: document.getElementById('menu-category').value,
      image_url: document.getElementById('menu-image').value || null,
      is_available: document.getElementById('menu-available').checked
    };
    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu`, {
        method: 'POST',
        body: JSON.stringify(menuData)
      });
      document.getElementById('add-menu-form').reset();
      document.getElementById('menu-available').checked = true;
      addMenuModal.style.display = 'none';
      loadMenuItems();
    } catch (error) {
      alert('Failed to add menu item: ' + error.message);
    }
  });

  // Order filter
  document.getElementById('order-status-filter').addEventListener('change', (e) => {
    loadRestaurantOrders(e.target.value);
  });

  // Setup restaurant form
  document.getElementById('setup-restaurant-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/restaurants', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('setup-name').value,
          cuisine: document.getElementById('setup-cuisine').value,
          description: document.getElementById('setup-description').value,
          address: document.getElementById('setup-address').value,
          phone: document.getElementById('setup-phone').value,
          image_url: document.getElementById('setup-image').value || null
        })
      });
      restaurant = data.restaurant;
      alert('Restaurant created!');
      loadDashboard();
    } catch (error) {
      alert('Failed to create restaurant: ' + error.message);
    }
  });

  // User profile form
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: document.getElementById('profile-name').value,
          phone: document.getElementById('profile-phone').value,
          address: document.getElementById('profile-address').value
        })
      });
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('Profile updated!');
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    }
  });

  // Restaurant profile form
  document.getElementById('restaurant-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!restaurant) return alert('Create your restaurant first');
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: document.getElementById('rest-name').value,
          cuisine: document.getElementById('rest-cuisine').value,
          description: document.getElementById('rest-description').value,
          address: document.getElementById('rest-address').value,
          phone: document.getElementById('rest-phone').value,
          image_url: document.getElementById('rest-image').value.trim() || null,
          delivery_time: parseInt(document.getElementById('rest-delivery-time').value) || 30
        })
      });
      restaurant = data.restaurant;
      updateRestaurantImagePreview(restaurant.image_url);
      alert('Restaurant updated!');
    } catch (error) {
      alert('Failed to update restaurant: ' + error.message);
    }
  });

  // Assign partner confirm
  document.getElementById('confirm-assign-btn').addEventListener('click', confirmAssign);
  document.getElementById('rest-image').addEventListener('input', (event) => {
    updateRestaurantImagePreview(event.target.value.trim());
  });

  loadDashboard();
});

async function loadTabContent(tabId) {
  if (tabId === 'dashboard') await loadDashboard();
  else if (tabId === 'menu') await loadMenuItems();
  else if (tabId === 'orders') await loadRestaurantOrders();
  else if (tabId === 'profile') await loadRestaurantProfileForm();
}

function updateRestaurantImagePreview(url) {
  const preview = document.getElementById('rest-image-preview');
  if (!preview) return;
  preview.src = url || '';
  preview.classList.toggle('hidden', !url);
}

// Fetch restaurant profile without throwing when absent
async function fetchRestaurant() {
  try {
    const data = await apiRequest('/restaurants/profile');
    return data.restaurant;
  } catch (error) {
    return null;
  }
}

async function loadDashboard() {
  restaurant = await fetchRestaurant();
  const setupCard = document.getElementById('restaurant-setup');
  const content = document.getElementById('dashboard-content');

  if (!restaurant) {
    setupCard.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }
  setupCard.classList.add('hidden');
  content.classList.remove('hidden');

  try {
    const { stats, recent_orders } = await apiRequest('/restaurant/dashboard');
    document.getElementById('today-orders').textContent = stats.today_orders;
    document.getElementById('today-revenue').textContent = formatCurrency(stats.today_revenue);
    document.getElementById('pending-orders').textContent = stats.pending_orders;
    document.getElementById('delivery-out').textContent = stats.ready_orders + stats.active_deliveries;

    const list = document.getElementById('recent-orders');
    if (!recent_orders.length) {
      showEmpty(list, 'No orders yet');
    } else {
      list.innerHTML = '';
      recent_orders.forEach(o => list.appendChild(createOrderSummary(o)));
    }
  } catch (error) {
    console.error(error);
  }
  loadRatings();
}

async function loadRatings() {
  const summary = document.getElementById('ratings-summary');
  const reviews = document.getElementById('recent-reviews');
  if (!summary || !reviews) return;
  try {
    const data = await apiRequest('/restaurant/ratings');
    summary.innerHTML = `
      <div class="rating-overview"><strong>${Number(data.summary.restaurant_rating || 0).toFixed(1)} ★</strong>
      <span>${data.summary.restaurant_review_count} restaurant reviews</span></div>
      <div class="item-rating-grid">${(data.item_ratings || []).map(item => `
        <div class="item-rating"><strong>${item.name}</strong><span>${Number(item.average_rating || 0).toFixed(1)} ★ (${item.rating_count})</span></div>
      `).join('') || '<span class="muted">No food ratings yet.</span>'}</div>
    `;
    reviews.innerHTML = (data.recent_reviews || []).map(review => `
      <div class="review-card"><strong>${review.customer_name || 'Customer'}</strong>
        <span>${review.rating} ★</span><p>${review.comment || 'No comment'}</p>
      </div>
    `).join('') || '<p class="muted">No customer feedback yet.</p>';
  } catch (error) {
    summary.innerHTML = `<p class="muted">Ratings unavailable: ${error.message}</p>`;
  }
}

function createOrderSummary(order) {
  const div = document.createElement('div');
  div.className = 'order-card';
  div.innerHTML = `
    <div class="order-header">
      <h4>Order #${order.id}</h4>
      <span class="status ${order.status.replace(/_/g, '_')}">${order.status.replace(/_/g, ' ')}</span>
    </div>
    <div class="order-details">
      <div><span>Customer:</span> ${order.customer_name}</div>
      <div><span>Date:</span> ${formatDate(order.created_at)}</div>
      <div><span>Total:</span> ${formatCurrency(order.total_amount)}</div>
      <div><span>Payment:</span> ${order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online'}</div>
    </div>
  `;
  return div;
}

async function loadRestaurantProfileForm() {
  restaurant = await fetchRestaurant();
  if (!restaurant) return;
  document.getElementById('rest-name').value = restaurant.name || '';
  document.getElementById('rest-cuisine').value = restaurant.cuisine || '';
  document.getElementById('rest-description').value = restaurant.description || '';
  document.getElementById('rest-address').value = restaurant.address || '';
  document.getElementById('rest-phone').value = restaurant.phone || '';
  document.getElementById('rest-image').value = restaurant.image_url || '';
  updateRestaurantImagePreview(restaurant.image_url);
  document.getElementById('rest-delivery-time').value = restaurant.delivery_time || 30;
}

// ---------- Menu ----------
async function loadMenuItems() {
  restaurant = await fetchRestaurant();
  const list = document.getElementById('menu-items-list');
  if (!restaurant) {
    showEmpty(list, 'Create your restaurant first');
    return;
  }
  showLoading(list);
  try {
    const { menuItems } = await apiRequest(`/restaurants/${restaurant.id}/menu`);
    if (!menuItems.length) {
      showEmpty(list, 'No menu items yet. Add some items to get started!');
      return;
    }
    list.innerHTML = '';
    menuItems.forEach(item => list.appendChild(createMenuItemCard(item)));
  } catch (error) {
    showError(list, error.message);
  }
}

function createMenuItemCard(item) {
  const card = document.createElement('div');
  card.className = 'menu-item-card';
  card.innerHTML = `
    ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="menu-item-image">` : ''}
    <div class="item-info">
      <h4>${item.name}</h4>
      <p class="price">${formatCurrency(item.price)}</p>
      <p class="description">${item.description || 'No description'}</p>
      <span class="category">${item.category || '-'}</span>
      ${!item.is_available ? '<span class="unavailable">Not Available</span>' : ''}
    </div>
    <div class="item-actions">
      <button class="btn-secondary edit-btn">Edit</button>
      <button class="btn-secondary delete-btn">Delete</button>
    </div>
  `;

  card.querySelector('.edit-btn').addEventListener('click', () => editMenuItem(item));
  card.querySelector('.delete-btn').addEventListener('click', () => deleteMenuItem(item, card));
  return card;
}

async function editMenuItem(item) {
  const name = prompt('Item name:', item.name);
  if (name === null) return;
  const price = prompt('Price:', item.price);
  if (price === null) return;
  const available = confirm('Is this item available? OK = Yes, Cancel = No');
  try {
    await apiRequest(`/restaurants/${restaurant.id}/menu/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, price: parseFloat(price), is_available: available })
    });
    loadMenuItems();
  } catch (error) {
    alert('Failed to update item: ' + error.message);
  }
}

async function deleteMenuItem(item, card) {
  if (!confirm(`Delete ${item.name}?`)) return;
  try {
    await apiRequest(`/restaurants/${restaurant.id}/menu/${item.id}`, { method: 'DELETE' });
    card.remove();
  } catch (error) {
    alert('Failed to delete item: ' + error.message);
  }
}

// ---------- Orders ----------
async function loadRestaurantOrders(filter = 'all') {
  const list = document.getElementById('restaurant-orders-list');
  showLoading(list);
  try {
    const { orders } = await apiRequest('/restaurant/orders');
    const filtered = filter && filter !== 'all'
      ? orders.filter(o => o.status === filter)
      : orders;

    if (!filtered.length) {
      showEmpty(list, 'No orders found');
      return;
    }
    list.innerHTML = '';
    filtered.forEach(o => list.appendChild(createOrderCard(o)));
  } catch (error) {
    showError(list, error.message);
  }
}

function createOrderCard(order) {
  const card = document.createElement('div');
  card.className = 'order-card';
  const statusClass = order.status.toLowerCase().replace(/\s/g, '_');

  let actions = '';
  if (order.status === 'pending') {
    actions = `
      <button class="btn-accept accept-btn">Accept</button>
      <button class="btn-danger reject-btn">Reject</button>`;
  } else if (order.status === 'accepted') {
    actions = `<button class="btn-primary prep-btn">Start Preparing</button>`;
  } else if (order.status === 'preparing') {
    actions = `<button class="btn-primary ready-btn">Mark Ready for Pickup</button>`;
  }

  const showAssign = ['accepted', 'preparing', 'ready_for_pickup'].includes(order.status)
    && !order.delivery_partner_id;
  const assignAction = showAssign
    ? `<button class="btn-secondary assign-btn">Assign Delivery Partner</button>`
    : '';

  const otpBlock = order.status === 'ready_for_pickup' && order.delivery_otp
    ? `<div class="otp-block"><strong>Pickup OTP:</strong> <span class="otp-badge">${order.delivery_otp}</span>
        <div class="muted">Share this OTP with the delivery partner at pickup.</div></div>`
    : '';

  const partnerBlock = order.delivery_partner_id
    ? `<div class="muted">Delivery Partner: <strong>${order.partner_name || 'Assigned'}</strong>
        ${order.delivery_status ? ` · ${order.delivery_status.replace(/_/g, ' ')}` : ''}</div>`
    : '';

  card.innerHTML = `
    <div class="order-header">
      <h4>Order #${order.id}</h4>
      <span class="status ${statusClass}">${order.status.replace(/_/g, ' ')}</span>
    </div>
    <div class="order-details">
      <div><span>Customer:</span> ${order.customer_name}</div>
      <div><span>Phone:</span> ${order.customer_phone || '-'}</div>
      <div><span>Address:</span> ${order.delivery_address || '-'}</div>
      <div><span>Date:</span> ${formatDate(order.created_at)}</div>
      <div><span>Total:</span> ${formatCurrency(order.total_amount)}</div>
      <div><span>Payment:</span> ${order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online'} (${order.payment_status})</div>
    </div>
    ${order.rejection_reason ? `<div class="muted">Reason: ${order.rejection_reason}</div>` : ''}
    ${otpBlock}
    ${partnerBlock}
    <div class="order-actions">${actions}${assignAction}</div>
  `;

  const acceptBtn = card.querySelector('.accept-btn');
  if (acceptBtn) acceptBtn.addEventListener('click', () => updateOrderAction(`/orders/${order.id}/accept`, 'Order accepted'));

  const rejectBtn = card.querySelector('.reject-btn');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', async () => {
      const reason = prompt('Reason for rejecting this order:', 'Item unavailable');
      if (reason === null) return;
      try {
        await apiRequest(`/orders/${order.id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
        loadRestaurantOrders();
      } catch (error) {
        alert('Failed to reject: ' + error.message);
      }
    });
  }

  const prepBtn = card.querySelector('.prep-btn');
  if (prepBtn) prepBtn.addEventListener('click', () => updateOrderAction(`/orders/${order.id}/status`, 'Order is now preparing', { status: 'preparing' }));

  const readyBtn = card.querySelector('.ready-btn');
  if (readyBtn) {
    readyBtn.addEventListener('click', async () => {
      try {
        const data = await apiRequest(`/orders/${order.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'ready_for_pickup' })
        });
        alert(`Order ready! Pickup OTP: ${data.delivery_otp}`);
        loadRestaurantOrders();
      } catch (error) {
        alert('Failed to update: ' + error.message);
      }
    });
  }

  const assignBtn = card.querySelector('.assign-btn');
  if (assignBtn) assignBtn.addEventListener('click', () => openAssignModal(order.id));

  return card;
}

async function updateOrderAction(endpoint, successMsg, body = null) {
  try {
    await apiRequest(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
    if (successMsg) alert(successMsg);
    loadRestaurantOrders();
  } catch (error) {
    alert('Failed: ' + error.message);
  }
}

// ---------- Assign delivery partner ----------
async function openAssignModal(orderId) {
  assignOrderId = orderId;
  selectedPartnerId = null;
  const modal = document.getElementById('assign-modal');
  const list = document.getElementById('partners-list');
  document.getElementById('confirm-assign-btn').disabled = true;
  showLoading(list);
  modal.style.display = 'block';

  try {
    const { partners } = await apiRequest('/delivery/available-partners');
    if (!partners.length) {
      showEmpty(list, 'No online delivery partners available right now');
      return;
    }
    list.innerHTML = partners.map(p => `
      <label class="partner-option">
        <input type="radio" name="partner" value="${p.id}">
        <div>
          <strong>${p.name}</strong>
          <div class="muted">${p.vehicle_type || 'vehicle'} · ${p.phone || 'no phone'}</div>
        </div>
      </label>
    `).join('');

    list.querySelectorAll('input[name="partner"]').forEach(radio => {
      radio.addEventListener('change', () => {
        selectedPartnerId = parseInt(radio.value);
        document.getElementById('confirm-assign-btn').disabled = false;
      });
    });
  } catch (error) {
    showError(list, error.message);
  }
}

async function confirmAssign() {
  if (!selectedPartnerId || !assignOrderId) return;
  try {
    await apiRequest(`/orders/${assignOrderId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ delivery_partner_id: selectedPartnerId })
    });
    document.getElementById('assign-modal').style.display = 'none';
    alert('Delivery partner assigned!');
    loadRestaurantOrders();
    loadDashboard();
  } catch (error) {
    alert('Failed to assign: ' + error.message);
  }
}