/* ============================================================
   NOTIFICATIONS.JS — Bell badge + browser push
   ============================================================ */

function pushNotification(text) {
  const notifs = store.get('notifications', []);
  notifs.unshift({ id: 'n' + Date.now(), text, date: Date.now(), read: false });
  store.set('notifications', notifs);
  updateBell();

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Classroom Hub', { body: text, icon: '📚' });
  }
}

function updateBell() {
  const notifs = store.get('notifications', []);
  const unread = notifs.filter(n => !n.read).length;
  const badge = document.getElementById('bellBadge');
  if (!badge) return;
  if (unread > 0) { badge.style.display = 'flex'; badge.textContent = unread; }
  else badge.style.display = 'none';
}

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

async function pollNewResources() {
  try {
    const res = await fetch(API_BASE + '/resources/latest', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const lastSeen = store.get('lastResourceId', '');
    if (data.latest && data.latest.id !== lastSeen) {
      store.set('lastResourceId', data.latest.id);
      pushNotification(`New resource: ${data.latest.name}`);
    }
  } catch (e) { /* offline or backend not ready */ }
}

setInterval(pollNewResources, 60000);