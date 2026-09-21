// Customer portal logic
import {
  apiRequest, getUserData, clearUserData, requireAuth,
  formatCurrency, formatDate, showLoading, showError, showEmpty
} from '../../assets/js/utils.js';

const DELIVERY_FEE = 2.0;

const STATUS_FLOW = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'accepted', label: 'Accepted by Restaurant' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' }
];

let currentUser = null;
let cart = { restaurantId: null, restaurantName: '', items: [] };
let trackPoller = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('customer')) return;

  currentUser = getUserData();
  if (currentUser) {
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}!`;
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-address').value = currentUser.address || '';
    document.getElementById('cart-address').value = currentUser.address || '';
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

  // Search
  document.getElementById('restaurant-search').addEventListener('input', (e) => {
    loadRestaurants(e.target.value.trim().toLowerCase());
  });

  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close).style.display = 'none';
      if (btn.dataset.close === 'track-modal' && trackPoller) {
        clearInterval(trackPoller);
        trackPoller = null;
      }
    });
  });
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
      if (e.target.id === 'track-modal' && trackPoller) {
        clearInterval(trackPoller);
        trackPoller = null;
      }
    }
  });

  // Cart
  document.getElementById('cart-fab').addEventListener('click', openCart);
  document.getElementById('place-order-btn').addEventListener('click', placeOrder);

  // Profile
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
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    }
  });

  loadTabContent('browse-restaurants');
});

async function loadTabContent(tabId) {
  if (tabId === 'browse-restaurants') await loadRestaurants();
  else if (tabId === 'my-orders') await loadOrders();
}

// ---------- Restaurants ----------
async function loadRestaurants(search = '') {
  const list = document.getElementById('restaurants-list');
  showLoading(list);
  try {
    const { restaurants } = await apiRequest('/restaurants');
    const filtered = search
      ? restaurants.filter(r =>
          (r.name || '').toLowerCase().includes(search) ||
          (r.cuisine || '').toLowerCase().includes(search))
      : restaurants;

    if (!filtered.length) {
      showEmpty(list, 'No restaurants found');
      return;
    }

    list.innerHTML = '';
    filtered.forEach(r => list.appendChild(createRestaurantCard(r)));
  } catch (error) {
    showError(list, error.message);
  }
}

function createRestaurantCard(restaurant) {
  const card = document.createElement('div');
  card.className = 'restaurant-card';
  const image = restaurant.image_url
    ? `<img src="${restaurant.image_url}" alt="${restaurant.name}" class="restaurant-image">`
    : `<div class="restaurant-image placeholder">🍽️</div>`;
  card.innerHTML = `
    ${image}
    <div class="restaurant-body">
      <h3>${restaurant.name}</h3>
      <div class="cuisine">${restaurant.cuisine || 'Various Cuisines'} · ⭐ ${restaurant.rating || '0.0'} · ${restaurant.delivery_time || 30} min</div>
      <p class="description">${restaurant.description || 'No description available'}</p>
      <button class="btn-primary view-menu-btn">View Menu</button>
    </div>
  `;
  card.querySelector('.view-menu-btn').addEventListener('click', () => openMenu(restaurant));
  return card;
}

// ---------- Menu ----------
async function openMenu(restaurant) {
  const modal = document.getElementById('menu-modal');
  document.getElementById('menu-modal-title').textContent = restaurant.name;
  const list = document.getElementById('menu-items-list');
  showLoading(list);
  modal.style.display = 'block';

  try {
    const { menuItems } = await apiRequest(`/restaurants/${restaurant.id}/menu`);
    if (!menuItems.length) {
      showEmpty(list, 'This restaurant has no menu items yet');
      return;
    }
    list.innerHTML = '';
    menuItems.forEach(item => list.appendChild(createMenuItemCard(item, restaurant)));
  } catch (error) {
    showError(list, error.message);
  }
}

function createMenuItemCard(item, restaurant) {
  const card = document.createElement('div');
  card.className = 'menu-item-card';
  card.innerHTML = `
    ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="menu-item-image">` : ''}
    <div class="item-info">
      <h4>${item.name}</h4>
      <p class="price">${formatCurrency(item.price)}</p>
      <p class="description">${item.description || 'No description'}</p>
      <span class="category">${item.category || 'misc'}</span>
      ${!item.is_available ? '<span class="unavailable">Not Available</span>' : ''}
    </div>
    <div class="item-actions">
      ${item.is_available
        ? `<button class="btn-primary add-item-btn">Add +</button>`
        : ''}
    </div>
  `;
  const addBtn = card.querySelector('.add-item-btn');
  if (addBtn) addBtn.addEventListener('click', () => addToCart(item, restaurant));
  return card;
}

// ---------- Cart ----------
function addToCart(item, restaurant) {
  if (cart.restaurantId && cart.restaurantId !== restaurant.id && cart.items.length) {
    if (!confirm('Your cart contains items from another restaurant. Start a new cart?')) return;
    cart = { restaurantId: null, restaurantName: '', items: [] };
  }
  cart.restaurantId = restaurant.id;
  cart.restaurantName = restaurant.name;

  const existing = cart.items.find(i => i.menu_item_id === item.id);
  if (existing) existing.quantity += 1;
  else cart.items.push({ menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1 });

  updateCartBadge();
  alert(`${item.name} added to cart`);
}

function updateCartBadge() {
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);
  const fab = document.getElementById('cart-fab');
  document.getElementById('cart-count-badge').textContent = count;
  fab.classList.toggle('hidden', count === 0);
}

function openCart() {
  if (!cart.items.length) return;
  const container = document.getElementById('cart-items');
  container.innerHTML = cart.items.map(i => `
    <div class="cart-item">
      <div>
        <strong>${i.name}</strong>
        <div class="muted">${formatCurrency(i.price)} each</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-id="${i.menu_item_id}" data-delta="-1">−</button>
        <span>${i.quantity}</span>
        <button class="qty-btn" data-id="${i.menu_item_id}" data-delta="1">+</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const delta = parseInt(btn.dataset.delta);
      const item = cart.items.find(i => i.menu_item_id === id);
      if (!item) return;
      item.quantity += delta;
      if (item.quantity <= 0) cart.items = cart.items.filter(i => i.menu_item_id !== id);
      if (!cart.items.length) {
        document.getElementById('cart-modal').style.display = 'none';
        cart.restaurantId = null;
      }
      updateCartBadge();
      openCart();
    });
  });

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('cart-fee').textContent = formatCurrency(DELIVERY_FEE);
  document.getElementById('cart-total').textContent = formatCurrency(subtotal + DELIVERY_FEE);
  document.getElementById('cart-modal').style.display = 'block';
}

async function placeOrder() {
  const address = document.getElementById('cart-address').value.trim();
  const paymentMode = document.querySelector('input[name="payment_mode"]:checked').value;

  if (!address) return alert('Please enter a delivery address');
  if (!cart.items.length) return alert('Your cart is empty');

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Placing...';

  try {
    await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: cart.restaurantId,
        items: cart.items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        delivery_address: address,
        payment_mode: paymentMode
      })
    });

    cart = { restaurantId: null, restaurantName: '', items: [] };
    updateCartBadge();
    document.getElementById('cart-modal').style.display = 'none';
    alert('Order placed successfully!');
    document.getElementById('my-orders-btn').click();
  } catch (error) {
    alert('Failed to place order: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

// ---------- Orders ----------
async function loadOrders() {
  const list = document.getElementById('orders-list');
  showLoading(list);
  try {
    const { orders } = await apiRequest('/orders');
    if (!orders.length) {
      showEmpty(list, 'No orders yet. Start ordering!');
      return;
    }
    list.innerHTML = '';
    orders.forEach(o => list.appendChild(createOrderCard(o)));
  } catch (error) {
    showError(list, error.message);
  }
}

function createOrderCard(order) {
  const card = document.createElement('div');
  card.className = 'order-card';
  const statusClass = (order.status || '').toLowerCase().replace(/\s/g, '_');
  const canCancel = ['pending', 'accepted'].includes(order.status);
  const canTrack = !['rejected', 'cancelled'].includes(order.status);

  card.innerHTML = `
    <div class="order-header">
      <h4>Order #${order.id}</h4>
      <span class="status ${statusClass}">${(order.status || '').replace(/_/g, ' ')}</span>
    </div>
    <div class="order-details">
      <div><span>Restaurant:</span> ${order.restaurant_name || 'Unknown'}</div>
      <div><span>Date:</span> ${formatDate(order.created_at)}</div>
      <div><span>Total:</span> ${formatCurrency(order.total_amount)}</div>
      <div><span>Payment:</span> ${order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online'} (${order.payment_status})</div>
    </div>
    <div class="order-actions">
      ${canTrack ? `<button class="btn-primary track-btn">Track Order</button>` : ''}
      ${canCancel ? `<button class="btn-danger cancel-btn">Cancel</button>` : ''}
    </div>
  `;

  const trackBtn = card.querySelector('.track-btn');
  if (trackBtn) trackBtn.addEventListener('click', () => openTrack(order.id));

  const cancelBtn = card.querySelector('.cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      if (!confirm('Cancel this order?')) return;
      try {
        await apiRequest(`/orders/${order.id}/cancel`, { method: 'POST' });
        loadOrders();
      } catch (error) {
        alert('Failed to cancel: ' + error.message);
      }
    });
  }

  return card;
}

// ---------- Tracking ----------
async function openTrack(orderId) {
  const modal = document.getElementById('track-modal');
  const content = document.getElementById('track-content');
  content.innerHTML = '<div class="loading">Loading...</div>';
  modal.style.display = 'block';

  try {
    const { order } = await apiRequest(`/orders/${orderId}`);
    document.getElementById('track-title').textContent = `Order #${order.id}`;
    renderTrack(order);

    if (trackPoller) { clearInterval(trackPoller); trackPoller = null; }

    if (order.delivery_id && ['picked_up', 'out_for_delivery'].includes(order.status)) {
      trackPoller = setInterval(async () => {
        try {
          const { delivery } = await apiRequest(`/deliveries/${order.delivery_id}/track`);
          updatePartnerLocation(delivery);
        } catch (e) { /* ignore polling errors */ }
      }, 5000);
    }
  } catch (error) {
    content.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

function renderTrack(order) {
  const content = document.getElementById('track-content');
  const isCancelled = order.status === 'rejected' || order.status === 'cancelled';

  if (isCancelled) {
    content.innerHTML = `
      <div class="track-cancelled">
        <h4>Order ${order.status}</h4>
        ${order.rejection_reason ? `<p>Reason: ${order.rejection_reason}</p>` : ''}
      </div>`;
    return;
  }

  const currentIndex = STATUS_FLOW.findIndex(s => s.key === order.status);

  const timeline = STATUS_FLOW.map((step, idx) => {
    const state = idx < currentIndex ? 'done' : (idx === currentIndex ? 'current' : 'todo');
    return `
      <div class="timeline-step ${state}">
        <div class="dot"></div>
        <div class="step-label">${step.label}</div>
      </div>`;
  }).join('');

  const items = (order.items || []).map(i =>
    `<div class="order-item"><span>${i.name} × ${i.quantity}</span><span>${formatCurrency(i.unit_price * i.quantity)}</span></div>`
  ).join('');

  const partner = order.partner_name ? `
    <div class="partner-card">
      <div><strong>Delivery Partner</strong></div>
      <div>${order.partner_name} · ${order.partner_vehicle || ''}</div>
      <div>📞 <a href="tel:${order.partner_phone}">${order.partner_phone || 'N/A'}</a></div>
      <div id="partner-location" class="muted">Waiting for live location...</div>
    </div>` : '';

  content.innerHTML = `
    <div class="track-timeline">${timeline}</div>
    <div class="track-meta">
      <div><strong>Status:</strong> ${order.status.replace(/_/g, ' ')}</div>
      <div><strong>Payment:</strong> ${order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online'} (${order.payment_status})</div>
      <div><strong>Delivery Address:</strong> ${order.delivery_address || '-'}</div>
      <div><strong>Total:</strong> ${formatCurrency(order.total_amount)}</div>
      ${order.delivery_otp && ['ready_for_pickup','picked_up','out_for_delivery'].includes(order.status)
        ? `<div><strong>Pickup OTP:</strong> <span class="otp-badge">${order.delivery_otp}</span></div>` : ''}
    </div>
    <h4>Items</h4>
    <div class="order-items">${items}</div>
    ${partner}
    ${order.status === 'delivered' ? renderReviewForm(order) : ''}
  `;

  const reviewForm = content.querySelector('#review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = reviewForm.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const itemRatings = [...reviewForm.querySelectorAll('[data-item-id]')].map(input => ({
          menu_item_id: Number(input.dataset.itemId),
          rating: Number(input.value)
        }));
        await apiRequest(`/orders/${order.id}/review`, {
          method: 'POST',
          body: JSON.stringify({
            restaurant_rating: Number(reviewForm.querySelector('[name="restaurant_rating"]').value),
            comment: reviewForm.querySelector('[name="comment"]').value.trim(),
            item_ratings: itemRatings
          })
        });
        reviewForm.innerHTML = '<p class="success">Thanks for helping the restaurant improve!</p>';
      } catch (error) {
        alert(`Failed to submit rating: ${error.message}`);
        button.disabled = false;
      }
    });
  }
}

function renderReviewForm(order) {
  const items = (order.items || []).map(item => `
    <label class="rating-item">
      <span>${item.name}</span>
      <select data-item-id="${item.menu_item_id}" required>
        <option value="">Rate food</option>
        <option value="5">5 - Excellent</option>
        <option value="4">4 - Good</option>
        <option value="3">3 - Okay</option>
        <option value="2">2 - Poor</option>
        <option value="1">1 - Bad</option>
      </select>
    </label>
  `).join('');
  return `
    <form id="review-form" class="review-form">
      <h4>Rate your meal</h4>
      <label>Restaurant rating
        <select name="restaurant_rating" required>
          <option value="">Select rating</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Okay</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Bad</option>
        </select>
      </label>
      ${items}
      <textarea name="comment" rows="2" placeholder="What could be improved?"></textarea>
      <button type="submit" class="btn-primary">Submit Rating</button>
    </form>
  `;
}

function updatePartnerLocation(delivery) {
  const el = document.getElementById('partner-location');
  if (!el) return;
  const loc = delivery.latest_location || (delivery.partner && delivery.partner.latitude
    ? { latitude: delivery.partner.latitude, longitude: delivery.partner.longitude } : null);
  if (!loc) {
    el.textContent = 'Waiting for live location...';
    return;
  }
  el.innerHTML = `📍 Live location: ${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}
    — <a href="https://www.google.com/maps?q=${loc.latitude},${loc.longitude}" target="_blank">view on map</a>`;
}