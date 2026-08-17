const API_BASE = '/api';

function showMessage(type, text) {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.className = `alert show ${type}`;
  el.textContent = text;
}

function setToken(token) {
  localStorage.setItem('rycolyn_token', token);
  localStorage.setItem('rycolynToken', token);
}

function getToken() {
  return localStorage.getItem('rycolyn_token') || localStorage.getItem('rycolynToken');
}

function clearToken() {
  localStorage.removeItem('rycolyn_token');
  localStorage.removeItem('rycolynToken');
}

async function apiRequest(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

async function login(username, password) {
  const result = await apiRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  setToken(result.token);
  return result;
}

async function getDashboardStats() {
  return apiRequest(`${API_BASE}/dashboard/stats`);
}

async function loadHomeSummary() {
  try {
    const stats = await getDashboardStats();
    const loggedIn = stats.totalPatients + stats.totalStudents + stats.totalCaregiversClients;
    document.getElementById('homeLoggedIn').textContent = loggedIn;
    document.getElementById('homeOnTrack').textContent = Math.max(0, loggedIn - (stats.lowStockItems?.length || 0));
    document.getElementById('homeBehind').textContent = stats.lowStockItems?.length || 0;
  } catch (error) {
    console.error(error);
  }
}

async function renderDashboard() {
  try {
    const data = await getDashboardStats();
    const stats = [
      { label: 'Logged in', value: data.totalPatients + data.totalStudents + data.totalCaregiversClients },
      { label: 'Clinics', value: data.totalPatients },
      { label: 'Caregiving', value: data.totalCaregiversClients },
      { label: 'Students', value: data.totalStudents },
      { label: 'Inventory', value: data.totalInventoryItems }
    ];

    const statsWrap = document.getElementById('dashboardStats');
    if (statsWrap) {
      statsWrap.innerHTML = stats.map(item => `
        <div class="metric">
          <div class="label">${item.label}</div>
          <div class="value">${item.value}</div>
          <div class="trend">Updated now</div>
        </div>
      `).join('');
    }

    const table = document.getElementById('trackingTable');
    if (table) {
      table.innerHTML = `
        <tr><th>Department</th><th>Logged In</th><th>Status</th></tr>
        <tr><td>Clinic</td><td>${data.totalPatients}</td><td><span class="status-pill ${data.totalPatients > 0 ? 'status-on' : 'status-risk'}">${data.totalPatients > 0 ? 'On track' : 'Needs action'}</span></td></tr>
        <tr><td>Caregiving</td><td>${data.totalCaregiversClients}</td><td><span class="status-pill ${data.totalCaregiversClients > 0 ? 'status-on' : 'status-risk'}">${data.totalCaregiversClients > 0 ? 'On track' : 'Needs action'}</span></td></tr>
        <tr><td>Education</td><td>${data.totalStudents}</td><td><span class="status-pill ${data.totalStudents > 0 ? 'status-on' : 'status-risk'}">${data.totalStudents > 0 ? 'On track' : 'Needs action'}</span></td></tr>
        <tr><td>Inventory</td><td>${data.totalInventoryItems}</td><td><span class="status-pill ${data.totalInventoryItems > 10 ? 'status-on' : 'status-behind'}">${data.totalInventoryItems > 10 ? 'On track' : 'Behind track'}</span></td></tr>
      `;
    }
  } catch (error) {
    console.error(error);
  }
}

function attachLoginLogic() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const result = await login(username, password);
      showMessage('success', `Welcome ${result.user.fullName || result.user.username}! Redirecting...`);
      setTimeout(() => window.location.href = '/dashboard', 900);
    } catch (error) {
      showMessage('error', error.message);
    }
  });

  const demo = document.getElementById('demoLoginBtn');
  if (demo) {
    demo.addEventListener('click', async () => {
      try {
        const result = await login('admin', 'admin123');
        showMessage('success', `Demo login successful for ${result.user.username}. Redirecting...`);
        setTimeout(() => window.location.href = '/dashboard', 900);
      } catch (error) {
        showMessage('error', error.message);
      }
    });
  }
}

function attachLogoutLogic() {
  const btn = document.getElementById('logoutButton');
  if (!btn) return;
  btn.addEventListener('click', () => {
    clearToken();
    window.location.href = '/login';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  attachLoginLogic();
  attachLogoutLogic();
  loadHomeSummary();
  renderDashboard();
});
