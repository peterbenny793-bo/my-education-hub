/* ============================================================
   APP.JS — Shared utilities, header, navigation, modal, toast
   ============================================================ */

const API_BASE = (() => {
  const h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5000/api';

  // GitHub Codespaces forwarded URL, e.g. my-codespace-name-8080.app.github.dev
  // -> swap the frontend's port for the backend's (5000), keep whatever domain
  // Codespaces is currently using (don't hardcode it, GitHub has changed it before).
  if (/\.(githubpreview\.dev|github\.dev)$/i.test(h)) {
    const m = h.match(/^(.+)-\d+((?:\.[a-z0-9-]+)+)$/i);
    if (m) return `https://${m[1]}-5000${m[2]}/api`;
  }

  return 'https://my-education-hub-6n8g.vercel.app';
})();

/* ── XSS Sanitizer ── */
const sanitize = (str) => {
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(String(str ?? ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
};

/* ── Storage helpers ── */
const store = {
  get(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

/* ── Build shared header ── */
function buildHeader() {
  const currentPage = location.pathname.split('/').pop().replace('.html','') || 'index';
  const pageMap = { index:'home', announcements:'announcements', resources:'resources', contact:'contact', admin:'admin' };
  const active = pageMap[currentPage] || '';

  document.getElementById('mainHeader').innerHTML = `
    <div class="nav-wrap">
      <a href="index.html" class="logo"><img src="assets/logo.png" class="logo-icon" alt="" width="28" height="28" /><span>Classroom Hub</span></a>
      <nav class="nav-links" id="navLinks">
        <a href="index.html" class="${active==='home'?'active':''}">Home</a>
        <a href="announcements.html" class="${active==='announcements'?'active':''}">Announcements</a>
        <a href="resources.html" class="${active==='resources'?'active':''}">Resources</a>
        <a href="contact.html" class="${active==='contact'?'active':''}">Contact</a>
        <a href="admin.html" class="${active==='admin'?'active':''}">Admin</a>
      </nav>
      <div class="nav-right">
        <button class="bell-btn" id="bellBtn" title="Notifications">
          🔔<span class="bell-badge" id="bellBadge" style="display:none">0</span>
        </button>
        <button class="hamburger" id="hamburger">☰</button>
      </div>
    </div>
  `;

  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  document.getElementById('bellBtn').addEventListener('click', () => {
    const notifs = store.get('notifications', []);
    if (!notifs.length) { toast('No notifications'); return; }
    notifs.forEach(n => n.read = true);
    store.set('notifications', notifs);
    updateBell();
    openModal('Notifications', notifs.map(n => `
      <div style="padding:.6rem;border-bottom:1px solid var(--border)">
        <div>${sanitize(n.text)}</div>
        <div style="font-size:.75rem;color:var(--muted)">${timeAgo(n.date)}</div>
      </div>
    `).join(''));
  });
}

/* ── Build shared footer ── */
function buildFooter() {
  const footer = document.getElementById('mainFooter');
  if (!footer) return;
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="footer-wrap">
      <a href="index.html" class="footer-brand">
        <img src="assets/logo.png" alt="" width="24" height="24" />
        <span>Classroom Hub</span>
      </a>
      <nav class="footer-links">
        <a href="index.html">Home</a>
        <a href="announcements.html">Announcements</a>
        <a href="resources.html">Resources</a>
        <a href="contact.html">Contact</a>
        <a href="policy.html">Privacy &amp; Content Policy</a>
      </nav>
      <div class="footer-meta">&copy; ${year} Classroom Hub &mdash; your classroom companion</div>
    </div>
  `;
}

/* ── Toast ── */
function toast(msg, type='info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ── Modal ── */
function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'modal') closeModal();
});

/* ── Admin state ── */
let isAdmin = store.get('isAdmin', false);
function updateAdminUI() {
  const postBar = document.getElementById('adminPostBar');
  const uploadBar = document.getElementById('adminUploadBar');
  if (postBar) postBar.style.display = isAdmin ? 'block' : 'none';
  if (uploadBar) uploadBar.style.display = isAdmin ? 'block' : 'none';
}

/* ── Utilities ── */
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  buildHeader();
  buildFooter();
  updateAdminUI();
  if (typeof updateBell === 'function') updateBell();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW failed:', err));
  }
});