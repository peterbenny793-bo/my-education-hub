/* ============================================================
   CONTACT.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cStatus').addEventListener('change', (e) => {
    document.getElementById('classGroup').style.display = e.target.value === 'Student' ? 'block' : 'none';
  });

  document.getElementById('cMessage').addEventListener('input', (e) => {
    document.getElementById('cCount').textContent = e.target.value.length;
  });

  document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = {
      name: sanitize(document.getElementById('cName').value.trim()),
      status: sanitize(document.getElementById('cStatus').value),
      class: document.getElementById('cStatus').value === 'Student' ? sanitize(document.getElementById('cClass').value) : null,
      contact: sanitize(document.getElementById('cContact').value.trim()),
      message: sanitize(document.getElementById('cMessage').value.trim())
    };

    if (!msg.name || !msg.status || !msg.contact || !msg.message) { toast('Fill all fields', 'error'); return; }
    if (msg.status === 'Student' && !msg.class) { toast('Select class', 'error'); return; }

    try {
      const res = await fetch(API_BASE + '/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      if (!res.ok) throw new Error('Backend error');
    } catch (err) {
      const msgs = store.get('messages', []);
      msgs.unshift({ ...msg, id: 'm' + Date.now(), date: Date.now() });
      store.set('messages', msgs);
    }

    e.target.reset();
    document.getElementById('cCount').textContent = '0';
    document.getElementById('classGroup').style.display = 'none';
    toast('Message sent!', 'success');
  });
});