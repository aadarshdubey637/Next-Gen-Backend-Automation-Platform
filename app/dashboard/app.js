/* ══════════════════════════════════════════════════════
   AutoBackend — Next-Gen SaaS Landing Page JS
   ══════════════════════════════════════════════════════ */

const API = window.location.origin;
let authToken = localStorage.getItem('token') || null;
let currentUser = null;
let isSignup = false;

// ── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        fetchCurrentUser();
        hideAuthModal();
    }
    
    // Initialize stats
    loadStats();
    loadSchemas();
    
    // Event listener for user menu
    document.getElementById('avatar-btn')?.addEventListener('click', () => {
        document.getElementById('user-dropdown').classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('user-dropdown')?.classList.remove('show');
        }
        if (e.target.id === 'error-modal' || e.target.id === 'auth-modal') {
            hideAuthModal();
            closeErrorModal();
        }
    });
});

// ── Auth ────────────────────────────────────────────────
function showAuthModal() { 
    document.getElementById('auth-modal').classList.remove('hidden'); 
}

function hideAuthModal() { 
    document.getElementById('auth-modal').classList.add('hidden'); 
}

function toggleAuthMode() {
    isSignup = !isSignup;
    document.getElementById('auth-modal-title').textContent = isSignup ? 'Create Account' : 'Welcome Back';
    document.getElementById('auth-modal-subtitle').textContent = isSignup ? 'Sign up for a new account' : 'Sign in to your account';
    document.getElementById('signup-email-group').style.display = isSignup ? 'block' : 'none';
    document.getElementById('auth-submit-btn').querySelector('.btn-text').textContent = isSignup ? 'Sign Up' : 'Sign In';
    document.getElementById('auth-toggle-text').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('auth-toggle-btn').textContent = isSignup ? 'Sign In' : 'Sign Up';
}

async function handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById('auth-submit-btn');
    setLoading(btn, true);

    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;

    try {
        if (isSignup) {
            const email = document.getElementById('auth-email').value;
            await apiFetch('/api/v1/auth/signup', 'POST', { email, username, password });
            toast('Account created! Signing in...', 'success');
        }
        const res = await apiFetch('/api/v1/auth/login', 'POST', { username, password });
        authToken = res.access_token;
        localStorage.setItem('token', authToken);
        localStorage.setItem('refresh_token', res.refresh_token);
        hideAuthModal();
        await fetchCurrentUser();
        toast('Welcome back!', 'success');
    } catch (err) {
        toast(err.message || 'Authentication failed', 'error');
    }
    setLoading(btn, false);
}

function logout() {
    authToken = null; currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    
    // Update UI
    document.getElementById('btn-login-trigger').classList.remove('hidden');
    document.getElementById('avatar-btn').classList.add('hidden');
    
    toast('Logged out', 'info');
}

async function fetchCurrentUser() {
    try {
        currentUser = await apiFetch('/api/v1/auth/me');
        const avatar = document.getElementById('avatar-btn');
        const loginBtn = document.getElementById('btn-login-trigger');
        
        if (avatar && loginBtn) {
            avatar.textContent = (currentUser.username || 'U')[0].toUpperCase();
            avatar.classList.remove('hidden');
            loginBtn.classList.add('hidden');
        }
        
        document.getElementById('dropdown-name').textContent = currentUser.username;
        document.getElementById('dropdown-role').textContent = currentUser.role;
    } catch { 
        logout(); 
    }
}

// ── Mode Switching ──────────────────────────────────────
function switchMode(mode) {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('mode-' + mode).classList.add('active');
}

// ── Generation ──────────────────────────────────────────
function loadExample() {
    document.getElementById('json-editor').value = JSON.stringify({
        name: "Product",
        description: "E-commerce product catalog",
        db_type: "postgresql",
        enable_auth: true,
        fields: [
            { "name": "title", "field_type": "string", "required": true },
            { "name": "price", "field_type": "float", "required": true, "min_value": 0 },
            { "name": "in_stock", "field_type": "boolean", "required": true }
        ]
    }, null, 2);
}

async function generateFromJSON() {
    const btn = document.querySelector('#mode-json .btn-primary');
    setLoading(btn, true);
    try {
        const raw = JSON.parse(document.getElementById('json-editor').value);
        const res = await apiFetch('/api/v1/schemas/from-json', 'POST', raw);
        showResult(res);
        toast('API generated successfully!', 'success');
        loadStats(); // Update stats
        loadSchemas(); // Update tester dropdown
    } catch (err) { 
        handleApiError(err, 'Generation Failed');
    }
    setLoading(btn, false);
}

async function generateFromPrompt() {
    const btn = document.querySelector('#mode-prompt .btn-primary');
    setLoading(btn, true);
    try {
        const prompt = document.getElementById('ai-prompt').value;
        if (!prompt.trim()) {
            toast('Please enter a prompt', 'error');
            setLoading(btn, false);
            return;
        }
        const db_type = document.getElementById('prompt-db-type').value;
        const res = await apiFetch('/api/v1/schemas/from-prompt', 'POST', { prompt, db_type });
        
        if (Array.isArray(res) && res.length > 0) {
            showResult(res[0]);
            toast(`Generated API from prompt!`, 'success');
        } else if (!Array.isArray(res) && res && res.name) {
            showResult(res);
            toast(`Generated API from prompt!`, 'success');
        } else {
            toast('AI could not understand the prompt. Please try to be more specific.', 'error');
        }
        
        loadStats();
        loadSchemas();
    } catch (err) { 
        handleApiError(err, 'AI Generation Failed');
    }
    setLoading(btn, false);
}

function showResult(data) {
    const panel = document.getElementById('result-panel');
    const placeholder = document.getElementById('builder-placeholder');
    
    if (placeholder) placeholder.style.display = 'none';
    panel.style.display = 'block';
    
    let html = `<div class="result-meta"><strong>${data.name}</strong> — ${data.message}</div>`;
    html += `<p style="color:var(--text-muted);font-size:13px;margin:8px 0">Database: <strong>${data.db_type}</strong> | Schema ID: <code>${data.schema_id}</code></p>`;
    html += '<ul class="endpoint-list">';
    (data.endpoints || []).forEach(ep => {
        html += `<li class="endpoint-item">
            <span class="method-badge ${ep.method}">${ep.method}</span>
            <span class="endpoint-path">${ep.path}</span>
            <span class="endpoint-desc">${ep.description}</span>
        </li>`;
    });
    html += '</ul>';
    document.getElementById('result-content').innerHTML = html;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeResult() {
    document.getElementById('result-panel').style.display = 'none';
    document.getElementById('builder-placeholder').style.display = 'flex';
}

// ── API Tester ──────────────────────────────────────────
function switchTesterTab(tab) {
    document.querySelectorAll('.tester-section .tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase() === tab));
    document.getElementById('tester-body-panel').classList.toggle('hidden', tab !== 'body');
    document.getElementById('tester-headers-panel').classList.toggle('hidden', tab !== 'headers');
}

async function sendRequest() {
    const method = document.getElementById('tester-method').value;
    const path = document.getElementById('tester-url').value;
    const bodyRaw = document.getElementById('tester-body').value;
    const headersRaw = document.getElementById('tester-headers').value;
    const statusEl = document.getElementById('response-status');
    const bodyEl = document.getElementById('response-body');

    if (!path) {
        toast('Please enter an endpoint URL', 'error');
        return;
    }

    let url = path.startsWith('http') ? path : API + path;
    let headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

    try {
        if (headersRaw.trim()) Object.assign(headers, JSON.parse(headersRaw));
    } catch {}

    const opts = { method, headers };
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyRaw.trim()) opts.body = bodyRaw;

    try {
        const start = performance.now();
        const res = await fetch(url, opts);
        const elapsed = (performance.now() - start).toFixed(0);
        const data = await res.text();
        statusEl.textContent = `${res.status} ${res.statusText} — ${elapsed}ms`;
        statusEl.className = 'status ' + (res.ok ? 'success' : 'error');
        try { bodyEl.textContent = JSON.stringify(JSON.parse(data), null, 2); } catch { bodyEl.textContent = data; }
    } catch (err) {
        statusEl.textContent = 'Error'; statusEl.className = 'status error';
        bodyEl.textContent = err.message;
    }
}

async function onApiSelect(schemaId) {
    if (!schemaId) return;
    try {
        const data = await apiFetch('/api/v1/schemas/' + schemaId);
        const endpoints = data.generated_code?.endpoints || [];
        const mainEndpoint = endpoints.find(e => e.method === 'GET' && !e.path.includes('{')) || endpoints[0];
        
        if (mainEndpoint) {
            document.getElementById('tester-url').value = mainEndpoint.path;
            document.getElementById('tester-method').value = mainEndpoint.method;
            toast(`Selected ${data.name} API`, 'success');
        }
    } catch (err) {
        toast('Error loading API details', 'error');
    }
}

// ── Schemas ─────────────────────────────────────────────
async function loadSchemas() {
    try {
        const schemas = await apiFetch('/api/v1/schemas/');
        const testerDropdown = document.getElementById('tester-api-list');
        if (testerDropdown) {
            testerDropdown.innerHTML = '<option value="">-- Choose a Generated API --</option>' + 
                schemas.map(s => `<option value="${s.id}">${s.name} (${s.db_type})</option>`).join('');
        }
    } catch (err) { 
        console.error('Failed to load schemas', err); 
    }
}

// ── Stats ───────────────────────────────────────────────
async function loadStats() {
    try {
        const health = await apiFetch('/health');
        const healthEl = document.getElementById('stat-health');
        if (healthEl) healthEl.textContent = health.status === 'healthy' ? '99.9%' : 'Down';
    } catch {}

    try {
        const stats = await apiFetch('/api/v1/admin/stats');
        const schemasPreview = document.getElementById('stat-schemas-preview');
        if (schemasPreview) schemasPreview.textContent = stats.schemas?.total ?? '0';
    } catch {}
}

// ── Helpers ─────────────────────────────────────────────
async function apiFetch(path, method = 'GET', body = null) {
    const url = path.startsWith('http') ? path : API + path;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) {
        const errorPayload = data.detail || data;
        throw new Error(typeof errorPayload === 'object' ? JSON.stringify(errorPayload) : errorPayload);
    }
    return data;
}

function handleApiError(err, title) {
    let detail = err.message;
    try {
        const parsed = JSON.parse(err.message);
        detail = parsed.detail || parsed;
    } catch {}
    showErrorModal(title, detail);
}

function showErrorModal(title, errorData) {
    document.getElementById('error-modal-title').textContent = title;
    const body = document.getElementById('error-modal-body');
    body.innerHTML = '';

    if (Array.isArray(errorData)) {
        errorData.forEach(err => {
            const item = document.createElement('div');
            item.className = 'validation-error-item';
            const loc = Array.isArray(err.loc) ? err.loc.join(' → ') : err.loc;
            item.innerHTML = `<div class="error-loc">${loc}</div><div class="error-msg">${err.msg}</div>`;
            body.appendChild(item);
        });
    } else {
        const item = document.createElement('div');
        item.className = 'validation-error-item';
        item.innerHTML = `<div class="error-msg">${typeof errorData === 'object' ? JSON.stringify(errorData, null, 2) : errorData}</div>`;
        body.appendChild(item);
    }
    document.getElementById('error-modal').classList.remove('hidden');
}

function closeErrorModal() {
    document.getElementById('error-modal').classList.add('hidden');
}

function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (text) text.style.display = loading ? 'none' : 'inline';
    if (loader) loader.classList.toggle('hidden', !loading);
    btn.disabled = loading;
}

function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
}
