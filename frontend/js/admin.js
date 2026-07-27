/* ============================================================
   ADMIN.JS
   ============================================================ */

let currentAdminTab = 'messages';

document.addEventListener('DOMContentLoaded', () => {
  renderAdmin();

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        isAdmin = true;
        store.set('isAdmin', true);
        store.set('adminToken', data.token);
        finishLogin();
      } else {
        toast(data.error || 'Invalid credentials', 'error');
      }
    } catch (err) {
      toast('Could not reach the server. Check your connection and try again.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

function finishLogin() {
  updateAdminUI();
  renderAdmin();
  toast('Welcome, Teacher!', 'success');
}

/* Attach the stored admin session token to a protected API request. */
function adminHeaders(extra) {
  const token = store.get('adminToken', '');
  return Object.assign({ Authorization: token ? `Bearer ${token}` : '' }, extra || {});
}

async function logout() {
  const token = store.get('adminToken', '');
  if (token) {
    try {
      await fetch(API_BASE + '/auth/logout', { method: 'POST', headers: adminHeaders() });
    } catch (err) { /* best-effort — clear local state regardless */ }
  }
  isAdmin = false;
  store.set('isAdmin', false);
  store.set('adminToken', '');
  updateAdminUI();
  renderAdmin();
  toast('Logged out');
}

function renderAdmin() {
  updateAdminUI();
  document.getElementById('adminLogin').style.display = isAdmin ? 'none' : 'block';
  document.getElementById('adminPanel').style.display = isAdmin ? 'block' : 'none';
  if (isAdmin) switchAdminTab(currentAdminTab);
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const c = document.getElementById('adminContent');
  if (tab === 'messages') renderAdminMessages(c);
  else if (tab === 'posts') renderAdminPosts(c);
  else if (tab === 'resources') renderAdminResources(c);
  else if (tab === 'notifications') renderAdminNotifications(c);
}

function renderAdminMessages(c) {
  const msgs = store.get('messages', []);
  if (!msgs.length) { c.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>No messages yet</p></div>'; return; }
  c.innerHTML = msgs.map(m => `
    <div class="message-item">
      <div class="message-head">
        <div><strong>${sanitize(m.name)}</strong> <span class="badge">${sanitize(m.status)}</span>${m.class?` <span class="badge">${sanitize(m.class)}</span>`:''}</div>
        <button class="btn btn-danger btn-sm" onclick="deleteMessage('${m.id}')">Delete</button>
      </div>
      <div style="font-size:.85rem;color:var(--muted);margin-bottom:.4rem">${sanitize(m.contact)} • ${timeAgo(m.date)}</div>
      <div>${sanitize(m.message)}</div>
    </div>
  `).join('');
}

function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  let msgs = store.get('messages', []);
  msgs = msgs.filter(m => m.id !== id);
  store.set('messages', msgs);
  renderAdminMessages(document.getElementById('adminContent'));
  toast('Message deleted');
}

function renderAdminPosts(c) {
  const posts = store.get('posts', []);
  c.innerHTML = posts.map(p => `
    <div class="message-item">
      <div class="message-head">
        <strong>${sanitize(p.title)}</strong>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-outline btn-sm" onclick="location.href='announcements.html'">View</button>
          <button class="btn btn-danger btn-sm" onclick="deletePostAdmin('${p.id}')">Delete</button>
        </div>
      </div>
      <div style="font-size:.85rem;color:var(--muted)">${timeAgo(p.date)} • ${p.reactions||0} ❤️ • ${(p.comments||[]).length} comments</div>
    </div>
  `).join('') || '<div class="empty"><p>No posts</p></div>';
}

function deletePostAdmin(id) {
  if (!confirm('Delete this post?')) return;
  let posts = store.get('posts', []);
  posts = posts.filter(p => p.id !== id);
  store.set('posts', posts);
  renderAdminPosts(document.getElementById('adminContent'));
  toast('Post deleted');
}

function renderAdminResources(c) {
  const resources = store.get('resources', {});
  let html = '';
  SUBJECTS.forEach(s => {
    const topics = resources[s] || [];
    if (!topics.length) return;
    html += `<h2 style="margin-top:1rem">${s}</h2>`;
    topics.forEach(t => {
      html += `<div class="message-item"><strong>${sanitize(t.title)}</strong>
        <button class="btn btn-outline btn-sm" style="margin-left:.5rem" onclick="location.href='resources.html'">View</button>
        <div style="font-size:.85rem;color:var(--muted);margin-top:.3rem">${t.items.length} resource(s)</div>
      </div>`;
    });
  });
  c.innerHTML = html || '<div class="empty"><p>No resources</p></div>';
}

function renderAdminNotifications(c) {
  const notifs = store.get('notifications', []);
  if (!notifs.length) { c.innerHTML = '<div class="empty"><div class="empty-icon">🔔</div><p>No notifications yet</p></div>'; return; }
  c.innerHTML = notifs.map(n => `
    <div class="message-item">
      <div class="message-head">
        <div>${sanitize(n.text)}</div>
        <button class="btn btn-danger btn-sm" onclick="deleteNotification('${n.id}')">×</button>
      </div>
      <div style="font-size:.8rem;color:var(--muted)">${timeAgo(n.date)}</div>
    </div>
  `).join('');
}

function deleteNotification(id) {
  let notifs = store.get('notifications', []);
  notifs = notifs.filter(n => n.id !== id);
  store.set('notifications', notifs);
  updateBell();
  switchAdminTab('notifications');
}