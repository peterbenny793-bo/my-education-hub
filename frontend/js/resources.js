/* ============================================================
   RESOURCES.JS
   ============================================================ */

const SUBJECTS = [
  'Grade 12 Advanced Maths','Grade 12 General Maths',
  'Grade 11 Advanced Maths','Grade 11 General Maths',
  'Grade 10 Maths','Grade 9 Maths',
  'Physics','Chemistry','ICT'
];
let currentSubject = SUBJECTS[0];

if (!store.get('resources')) {
  const seed = {};
  SUBJECTS.forEach(s => seed[s] = []);
  seed['Grade 12 Advanced Maths'] = [{
    id: 't1', title: 'Calculus — Differentiation',
    items: [{ id: 'r1', type: 'pdf', name: 'Differentiation Notes.pdf', url: '#' }]
  }];
  store.set('resources', seed);
}

function renderSubjects() {
  const tabs = document.getElementById('subjectTabs');
  tabs.innerHTML = SUBJECTS.map(s => `
    <button class="subject-tab ${s===currentSubject?'active':''}" onclick="selectSubject('${s}')">${s}</button>
  `).join('');
  renderTopics();
}
function selectSubject(s) { currentSubject = s; renderSubjects(); }

function renderTopics() {
  const resources = store.get('resources', {});
  const topics = resources[currentSubject] || [];
  const container = document.getElementById('topicsContainer');
  if (!topics.length) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">📂</div><p>No topics yet for this subject</p></div>';
    return;
  }
  container.innerHTML = topics.map(t => `
    <div class="topic-card">
      <div class="topic-head">
        <div class="card-title">${sanitize(t.title)}</div>
        <div style="display:flex;gap:.3rem">
          ${isAdmin ? `
            <button class="btn btn-outline btn-sm" onclick="editTopic('${t.id}')">Edit</button>
            <button class="btn btn-outline btn-sm" onclick="openUploadModal('${t.id}')">+ Upload</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTopic('${t.id}')">Delete</button>
          ` : ''}
        </div>
      </div>
      <div class="resource-list">
        ${t.items.map(item => renderResourceItem(t.id, item)).join('')}
      </div>
    </div>
  `).join('');
}

function renderResourceItem(tid, item) {
  const icons = { pdf: '📄', csv: '📊', audio: '🎵', video: '🎬', youtube: '▶️' };
  let extra = '';
  if (item.type === 'youtube' && item.url) {
    extra = `<div class="youtube-frame"><iframe src="${sanitize(item.url)}" allowfullscreen loading="lazy"></iframe></div>`;
  } else if (item.type === 'audio') {
    extra = `<audio controls src="${sanitize(item.url)}" style="width:100%;margin-top:.4rem"></audio>`;
  } else if (item.type === 'video' && item.url && !item.url.startsWith('#')) {
    extra = `<video controls src="${sanitize(item.url)}" style="width:100%;max-height:300px;margin-top:.4rem;border-radius:8px"></video>`;
  }
  return `
    <div class="resource-item">
      <div class="resource-icon">${icons[item.type]||'📎'}</div>
      <div class="resource-info">
        <div class="resource-name">${sanitize(item.name)}</div>
        <div class="resource-type">${item.type.toUpperCase()}</div>
      </div>
      <div class="resource-actions">
        ${item.type !== 'youtube' ? `
          <button class="btn btn-outline btn-sm" onclick="previewResource('${tid}','${item.id}')">Preview</button>
          <a class="btn btn-outline btn-sm" href="${sanitize(item.url)}" download="${sanitize(item.name)}">Download</a>
        ` : ''}
        ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteResource('${tid}','${item.id}')">Delete</button>` : ''}
      </div>
    </div>
    ${extra}
  `;
}

function previewResource(tid, rid) {
  const resources = store.get('resources', {});
  const topic = resources[currentSubject].find(t => t.id === tid);
  const item = topic.items.find(i => i.id === rid);
  let body = '';
  if (item.type === 'pdf') body = `<iframe src="${sanitize(item.url)}" style="width:100%;height:70vh;border:0;border-radius:8px"></iframe>`;
  else if (item.type === 'audio') body = `<audio controls src="${sanitize(item.url)}" style="width:100%"></audio>`;
  else if (item.type === 'video') body = `<video controls src="${sanitize(item.url)}" style="width:100%;max-height:60vh"></video>`;
  else if (item.type === 'csv') body = `<p>CSV file: ${sanitize(item.name)}</p><p style="color:var(--muted);font-size:.85rem">Download to view contents</p>`;
  else body = `<p>Preview not available</p>`;
  openModal(sanitize(item.name), body);
}

function openTopicModal(editId) {
  const resources = store.get('resources', {});
  const topics = resources[currentSubject] || [];
  const t = editId ? topics.find(x => x.id === editId) : null;
  openModal(t ? 'Edit Topic' : 'New Topic', `
    <div class="form-group"><label>Topic Title</label><input id="tTitle" value="${t?sanitize(t.title):''}" maxlength="120" /></div>
    <button class="btn btn-primary" onclick="saveTopic('${editId||''}')">${t?'Update':'Create'}</button>
  `);
}
function editTopic(id) { openTopicModal(id); }
function saveTopic(editId) {
  const title = sanitize(document.getElementById('tTitle').value.trim());
  if (!title) { toast('Title required', 'error'); return; }
  const resources = store.get('resources', {});
  resources[currentSubject] = resources[currentSubject] || [];
  if (editId) {
    const t = resources[currentSubject].find(x => x.id === editId);
    t.title = title;
  } else {
    resources[currentSubject].push({ id: 't' + Date.now(), title, items: [] });
  }
  store.set('resources', resources);
  closeModal();
  renderTopics();
  toast('Topic saved', 'success');
}
function deleteTopic(id) {
  if (!confirm('Delete this topic and all its resources?')) return;
  const resources = store.get('resources', {});
  resources[currentSubject] = resources[currentSubject].filter(t => t.id !== id);
  store.set('resources', resources);
  renderTopics();
  toast('Topic deleted');
}

function openUploadModal(topicId) {
  openModal('Upload Resource', `
    <div class="form-group"><label>Resource Name</label><input id="rName" maxlength="120" /></div>
    <div class="form-group"><label>Type</label>
      <select id="rType">
        <option value="pdf">PDF</option>
        <option value="csv">CSV</option>
        <option value="audio">Audio</option>
        <option value="video">Video</option>
        <option value="youtube">YouTube Link</option>
      </select>
    </div>
    <div class="form-group"><label>File / YouTube URL</label>
      <input type="file" id="rFile" accept=".pdf,.csv,audio/*,video/*" />
      <input type="url" id="rUrl" placeholder="https://www.youtube.com/..." style="margin-top:.4rem;display:none" />
    </div>
    <button class="btn btn-primary" onclick="saveResource('${topicId}')">Upload</button>
  `);
  document.getElementById('rType').addEventListener('change', (e) => {
    const isYT = e.target.value === 'youtube';
    document.getElementById('rFile').style.display = isYT ? 'none' : 'block';
    document.getElementById('rUrl').style.display = isYT ? 'block' : 'none';
  });
}

async function saveResource(topicId) {
  const name = sanitize(document.getElementById('rName').value.trim());
  const type = document.getElementById('rType').value;
  if (!name) { toast('Name required', 'error'); return; }
  let url = '';

  if (type === 'youtube') {
    let yt = document.getElementById('rUrl').value.trim();
    const match = yt.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) yt = 'https://www.youtube.com/embed/' + match[1];
    if (!yt.startsWith('http')) { toast('Valid URL required', 'error'); return; }
    url = yt;
  } else {
    const file = document.getElementById('rFile').files[0];
    if (!file) { toast('Select a file', 'error'); return; }
    url = URL.createObjectURL(file);
  }

  const resources = store.get('resources', {});
  const topic = resources[currentSubject].find(t => t.id === topicId);
  topic.items.push({ id: 'r' + Date.now(), type, name, url });
  store.set('resources', resources);
  closeModal();
  renderTopics();
  pushNotification(`New ${type.toUpperCase()} uploaded: ${name} in ${currentSubject}`);
  toast('Resource uploaded', 'success');
}

function deleteResource(tid, rid) {
  if (!confirm('Delete this resource?')) return;
  const resources = store.get('resources', {});
  const topic = resources[currentSubject].find(t => t.id === tid);
  topic.items = topic.items.filter(i => i.id !== rid);
  store.set('resources', resources);
  renderTopics();
  toast('Resource deleted');
}

document.addEventListener('DOMContentLoaded', () => {
  updateAdminUI();
  renderSubjects();
});