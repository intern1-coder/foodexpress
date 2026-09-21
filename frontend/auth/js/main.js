// Auth page logic (login / register) for all three roles
import { API_BASE_URL, saveUserData, getUserRole } from '../../assets/js/utils.js';

const ROLE_LABELS = {
  customer: 'Customer',
  restaurant_admin: 'Restaurant Admin',
  delivery_partner: 'Delivery Partner'
};

const ROLE_PORTALS = {
  customer: '../customer/',
  restaurant_admin: '../restaurant/',
  delivery_partner: '../delivery/'
};

const ROLE_ALIASES = {
  restaurant: 'restaurant_admin',
  delivery: 'delivery_partner'
};

const requestedRole = new URLSearchParams(window.location.search).get('role') || getUserRole() || 'customer';
const role = ROLE_ALIASES[requestedRole] || requestedRole;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('role-badge').textContent = ROLE_LABELS[role] || role;
  localStorage.setItem('userRole', role);

  const showError = (msg) => {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.classList.add('show');
  };
  const hideError = () => document.getElementById('error-msg').classList.remove('show');

  // Show vehicle field for delivery partners
  if (role === 'delivery_partner') {
    document.getElementById('vehicle-group').style.display = 'block';
  }

  // Tab switching
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  const switchAuthTab = (tab, form, inactiveTab, inactiveForm) => {
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    inactiveTab.classList.remove('active');
    inactiveTab.setAttribute('aria-selected', 'false');
    form.classList.add('active');
    form.hidden = false;
    inactiveForm.classList.remove('active');
    inactiveForm.hidden = true;
    hideError();
  };

  tabLogin.addEventListener('click', () => switchAuthTab(tabLogin, loginForm, tabRegister, registerForm));
  tabRegister.addEventListener('click', () => switchAuthTab(tabRegister, registerForm, tabLogin, loginForm));

  // POST helper
  const post = async (endpoint, body) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const data = await post('/login', { email, password });
      saveUserData(data.user, data.token);

      const userRole = data.user.role;
      if (userRole !== role) {
        showError(`This account is a ${userRole}. Please select the correct role portal.`);
        return;
      }
      window.location.href = ROLE_PORTALS[userRole];
    } catch (err) {
      showError(err.message);
    }
  });

  // Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const payload = {
      role,
      name: document.getElementById('reg-name').value.trim(),
      email: document.getElementById('reg-email').value.trim(),
      phone: document.getElementById('reg-phone').value.trim(),
      password: document.getElementById('reg-password').value,
      address: document.getElementById('reg-address').value.trim()
    };

    if (role === 'delivery_partner') {
      payload.vehicle_type = document.getElementById('reg-vehicle').value;
    }

    try {
      const data = await post('/register', payload);
      saveUserData(data.user, data.token);
      window.location.href = ROLE_PORTALS[role];
    } catch (err) {
      showError(err.message);
    }
  });
});