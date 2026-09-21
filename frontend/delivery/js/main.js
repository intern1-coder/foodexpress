// Delivery partner portal logic
import {
  apiRequest, getUserData, clearUserData, requireAuth,
  formatCurrency, formatDate, showLoading, showError, showEmpty
} from '../../assets/js/utils.js';

let currentUser = null;
let tracking = { deliveryId: null, intervalId: null };

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('delivery_partner')) return;

  currentUser = getUserData();
  if (currentUser) {
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}!`;
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-address').value = currentUser.address || '';
    document.getElementById('profile-vehicle').value = currentUser.vehicle_type || 'motorcycle';

    const toggle = document.getElementById('online-toggle');
    toggle.checked = !!currentUser.is_online;
    updateOnlineLabel(toggle.checked);
  }

  document.getElementById('logout-btn').addEventListener('click', () => {
    stopTracking();
    clearUserData();
    window.location.href = '../index.html';
  });

  // Online toggle
  document.getElementById('online-toggle').addEventListener('change', async (e) => {
    const isOnline = e.target.checked;
    try {
      const data = await apiRequest('/delivery/toggle-online', {
        method: 'PUT',
        body: JSON.stringify({ is_online: isOnline })
      });
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      updateOnlineLabel(isOnline);
    } catch (error) {
      e.target.checked = !isOnline;
      alert('Failed to change availability: ' + error.message);
    }
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

  // Profile
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: document.getElementById('profile-name').value,
          phone: document.getElementById('profile-phone').value,
          address: document.getElementById('profile-address').value,
          vehicle_type: document.getElementById('profile-vehicle').value
        })
      });
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('Profile updated!');
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    }
  });

  loadTabContent('available-deliveries');
});

function updateOnlineLabel(isOnline) {
  const label = document.getElementById('online-label');
  label.textContent = isOnline ? 'Online' : 'Offline';
  label.classList.toggle('online', isOnline);
}

async function loadTabContent(tabId) {
  if (tabId === 'available-deliveries') await loadAvailableDeliveries();
  else if (tabId === 'my-deliveries') await loadMyDeliveries();
  else if (tabId === 'earnings') await loadEarnings();
}

// ---------- Assigned (awaiting acceptance) ----------
async function loadAvailableDeliveries() {
  const list = document.getElementById('available-deliveries-list');
  showLoading(list);
  try {
    const { deliveries } = await apiRequest('/deliveries');
    const assigned = deliveries.filter(d => d.status === 'assigned');

    if (!assigned.length) {
      showEmpty(list, 'No new assigned deliveries right now');
      return;
    }
    list.innerHTML = '';
    assigned.forEach(d => list.appendChild(createAssignedCard(d)));
  } catch (error) {
    showError(list, error.message);
  }
}

function createAssignedCard(d) {
  const card = document.createElement('div');
  card.className = 'delivery-card';
  card.innerHTML = `
    <div class="delivery-header">
      <h4>Delivery #${d.id}</h4>
      <span class="status assigned">Assigned</span>
    </div>
    <div class="delivery-details">
      <div><span>Restaurant:</span> ${d.restaurant_name}</div>
      <div><span>Pickup:</span> ${d.pickup_location || d.restaurant_address || '-'}</div>
      <div><span>Customer:</span> ${d.customer_name}</div>
      <div><span>Destination:</span> ${d.delivery_location}</div>
      <div><span>Amount:</span> ${formatCurrency(d.total_amount)}</div>
      <div><span>Payment:</span> ${d.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online (paid)'}</div>
    </div>
    <div class="delivery-actions">
      <button class="btn-accept accept-btn">Accept</button>
      <button class="btn-danger reject-btn">Reject</button>
    </div>
  `;
  card.querySelector('.accept-btn').addEventListener('click', async () => {
    try {
      await apiRequest(`/deliveries/${d.id}/accept`, { method: 'PUT' });
      alert('Delivery accepted. Head to the restaurant.');
      loadAvailableDeliveries();
    } catch (error) {
      alert('Failed to accept: ' + error.message);
    }
  });
  card.querySelector('.reject-btn').addEventListener('click', async () => {
    if (!confirm('Reject this delivery assignment?')) return;
    try {
      await apiRequest(`/deliveries/${d.id}/reject`, { method: 'PUT' });
      loadAvailableDeliveries();
    } catch (error) {
      alert('Failed to reject: ' + error.message);
    }
  });
  return card;
}

// ---------- My deliveries (workflow) ----------
async function loadMyDeliveries() {
  const list = document.getElementById('my-deliveries-list');
  showLoading(list);
  try {
    const { deliveries } = await apiRequest('/deliveries');
    const active = deliveries.filter(d => d.status !== 'rejected');

    if (!active.length) {
      showEmpty(list, 'You have no deliveries yet');
      return;
    }
    list.innerHTML = '';
    active.forEach(d => list.appendChild(createMyDeliveryCard(d)));
  } catch (error) {
    showError(list, error.message);
  }
}

function createMyDeliveryCard(d) {
  const card = document.createElement('div');
  card.className = 'delivery-card';
  const statusClass = d.status.replace(/_/g, '_');

  const items = (d.items || []).map(i =>
    `<div class="order-item"><span>${i.name} × ${i.quantity}</span><span>${formatCurrency(i.unit_price * i.quantity)}</span></div>`
  ).join('');

  const paymentNote = d.status !== 'delivered'
    ? (d.payment_mode === 'cod'
        ? `<div class="pay-note cod">💵 Collect cash on delivery: ${formatCurrency(d.total_amount)}</div>`
        : `<div class="pay-note online">✅ Already paid online — do not collect cash</div>`)
    : '';

  let actions = '';
  if (d.status === 'assigned') {
    actions = `<button class="btn-accept accept-btn">Accept</button>
               <button class="btn-danger reject-btn">Reject</button>`;
  } else if (d.status === 'accepted') {
    if (d.order_status === 'ready_for_pickup') {
      actions = `
        <div class="otp-verify">
          <input type="text" class="otp-input" placeholder="Enter pickup OTP" maxlength="6">
          <button class="btn-primary verify-otp-btn">Verify &amp; Pick Up</button>
        </div>`;
    } else {
      actions = `<div class="muted">Waiting for the restaurant to mark the order ready…</div>`;
    }
  } else if (d.status === 'picked_up') {
    actions = `
      <button class="btn-primary out-btn">Start Delivery (Out for Delivery)</button>
      <button class="btn-secondary track-btn">📍 Share Live Location</button>`;
  } else if (d.status === 'out_for_delivery') {
    actions = `
      <button class="btn-accept delivered-btn">Mark Delivered</button>
      <button class="btn-secondary track-btn">📍 Toggle Live Location</button>`;
  }

  const earningsBlock = d.status === 'delivered'
    ? `<div class="earnings-line">Earnings: <strong>${formatCurrency(d.earnings || 0)}</strong></div>`
    : '';

  card.innerHTML = `
    <div class="delivery-header">
      <h4>Delivery #${d.id} · Order #${d.order_id}</h4>
      <span class="status ${statusClass}">${d.status.replace(/_/g, ' ')}</span>
    </div>
    <div class="delivery-details">
      <div><span>Restaurant:</span> ${d.restaurant_name}</div>
      <div><span>Pickup:</span> ${d.pickup_location || d.restaurant_address || '-'}</div>
      <div><span>Customer:</span> ${d.customer_name}</div>
      <div><span>Phone:</span> ${d.customer_phone || '-'}</div>
      <div><span>Destination:</span> ${d.delivery_location}</div>
      <div><span>Amount:</span> ${formatCurrency(d.total_amount)}</div>
    </div>
    ${items ? `<div class="order-items"><h5>Items</h5>${items}</div>` : ''}
    ${paymentNote}
    ${earningsBlock}
    <div class="delivery-actions">${actions}</div>
  `;

  const acceptBtn = card.querySelector('.accept-btn');
  if (acceptBtn) acceptBtn.addEventListener('click', async () => {
    try {
      await apiRequest(`/deliveries/${d.id}/accept`, { method: 'PUT' });
      loadMyDeliveries();
    } catch (error) { alert(error.message); }
  });

  const rejectBtn = card.querySelector('.reject-btn');
  if (rejectBtn) rejectBtn.addEventListener('click', async () => {
    if (!confirm('Reject this delivery?')) return;
    try {
      await apiRequest(`/deliveries/${d.id}/reject`, { method: 'PUT' });
      loadMyDeliveries();
    } catch (error) { alert(error.message); }
  });

  const verifyBtn = card.querySelector('.verify-otp-btn');
  if (verifyBtn) verifyBtn.addEventListener('click', async () => {
    const otp = card.querySelector('.otp-input').value.trim();
    if (!otp) return alert('Enter the OTP shown by the restaurant');
    try {
      await apiRequest(`/deliveries/${d.id}/verify-otp`, {
        method: 'PUT',
        body: JSON.stringify({ otp })
      });
      alert('OTP verified! Food picked up.');
      loadMyDeliveries();
    } catch (error) { alert('Failed: ' + error.message); }
  });

  const outBtn = card.querySelector('.out-btn');
  if (outBtn) outBtn.addEventListener('click', async () => {
    try {
      await apiRequest(`/deliveries/${d.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'out_for_delivery' })
      });
      startTracking(d.id);
      loadMyDeliveries();
    } catch (error) { alert(error.message); }
  });

  const deliveredBtn = card.querySelector('.delivered-btn');
  if (deliveredBtn) deliveredBtn.addEventListener('click', async () => {
    const confirmMsg = d.payment_mode === 'cod'
      ? `Confirm you collected ${formatCurrency(d.total_amount)} in cash and complete delivery?`
      : 'Confirm the order was handed over and complete delivery?';
    if (!confirm(confirmMsg)) return;
    try {
      await apiRequest(`/deliveries/${d.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'delivered' })
      });
      stopTracking();
      alert('Delivery completed!');
      loadMyDeliveries();
    } catch (error) { alert(error.message); }
  });

  const trackBtn = card.querySelector('.track-btn');
  if (trackBtn) {
    if (tracking.deliveryId === d.id) trackBtn.classList.add('active');
    trackBtn.addEventListener('click', () => {
      if (tracking.deliveryId === d.id) {
        stopTracking();
        trackBtn.classList.remove('active');
        trackBtn.textContent = '📍 Share Live Location';
      } else {
        startTracking(d.id);
        loadMyDeliveries();
      }
    });
  }

  return card;
}

// ---------- Live location tracking ----------
function startTracking(deliveryId) {
  stopTracking();
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser');
    return;
  }
  tracking.deliveryId = deliveryId;

  const send = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await apiRequest(`/deliveries/${deliveryId}/location`, {
          method: 'POST',
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        });
      } catch (e) { /* ignore intermittent errors */ }
    }, (err) => {
      console.warn('Location error:', err.message);
    }, { enableHighAccuracy: true, timeout: 8000 });
  };

  send();
  tracking.intervalId = setInterval(send, 10000);
}

function stopTracking() {
  if (tracking.intervalId) clearInterval(tracking.intervalId);
  tracking = { deliveryId: null, intervalId: null };
}

// ---------- Earnings ----------
async function loadEarnings() {
  try {
    const { summary, deliveries } = await apiRequest('/delivery/earnings');
    document.getElementById('today-earnings').textContent = formatCurrency(summary.today_earnings);
    document.getElementById('week-earnings').textContent = formatCurrency(summary.week_earnings);
    document.getElementById('total-deliveries').textContent = summary.total_deliveries;

    const list = document.getElementById('recent-deliveries-list');
    if (!deliveries.length) {
      showEmpty(list, 'No completed deliveries yet');
      return;
    }
    list.innerHTML = deliveries.slice(0, 10).map(d => `
      <div class="delivery-card">
        <div class="delivery-header">
          <h4>Delivery #${d.id}</h4>
          <span class="status delivered">Delivered</span>
        </div>
        <div class="delivery-details">
          <div><span>Restaurant:</span> ${d.restaurant_name}</div>
          <div><span>Customer:</span> ${d.customer_name}</div>
          <div><span>Order Amount:</span> ${formatCurrency(d.total_amount)}</div>
          <div><span>Earnings:</span> ${formatCurrency(d.earnings || 0)}</div>
          <div><span>Completed:</span> ${formatDate(d.actual_time || d.created_at)}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error(error);
  }
}