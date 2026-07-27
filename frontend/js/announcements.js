/* ============================================================
   ANNOUNCEMENTS.JS
   ============================================================ */

if (!store.get('posts')) {
  store.set('posts', [{
    id: 'p1', title: 'Welcome to the new term!',
    content: 'Hello students! Excited to start this journey with you.',
    author: 'Teacher', date: Date.now() - 86400000,
    reactions: 3, reactedByMe: false,
    comments: [{ id: 'c1', author: 'Student', text: 'Looking forward to it!', date: Date.now() - 3600000, replies: [] }]
  }]);
}

function renderPosts() {
  const posts = store.get('posts', []);
  const container = document.getElementById('postsContainer');
  if (!posts.length) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>No announcements yet</p></div>';
    return;
  }
  container.innerHTML = posts.slice().sort((a,b)=>b.date-a.date).map(p => `
    <div class="card" data-id="${p.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${sanitize(p.title)}</div>
          <div class="card-meta">By ${sanitize(p.author)} • ${timeAgo(p.date)}</div>
        </div>
        ${isAdmin ? `<div style="display:flex;gap:.3rem">
          <button class="btn btn-outline btn-sm" onclick="editPost('${p.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deletePost('${p.id}')">Delete</button>
        </div>` : ''}
      </div>
      <div class="post-content">${sanitize(p.content).replace(/\n/g,'<br>')}</div>
      <div class="post-actions">
        <button class="react-btn ${p.reactedByMe?'active':''}" onclick="toggleReaction('${p.id}')">❤️ <span>${p.reactions||0}</span></button>
        <button class="react-btn" onclick="toggleCommentBox('${p.id}')">💬 Comment</button>
      </div>
      <div class="comments-section" id="comments-${p.id}">
        ${renderComments(p)}
        <div id="commentbox-${p.id}" style="display:none;margin-top:.6rem">
          <input type="text" id="cinput-${p.id}" placeholder="Write a comment..." maxlength="200" />
          <button class="btn btn-primary btn-sm" style="margin-top:.4rem" onclick="addComment('${p.id}')">Post</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderComments(p) {
  return (p.comments || []).map(c => `
    <div class="comment">
      <div class="comment-head">
        <span class="comment-author">${sanitize(c.author)}</span>
        <span class="comment-time">${timeAgo(c.date)}</span>
      </div>
      <div>${sanitize(c.text)}</div>
      <div class="comment-actions">
        ${isAdmin ? `<button onclick="deleteComment('${p.id}','${c.id}')">Delete</button>` : ''}
        ${isAdmin ? `<button onclick="showReplyBox('${c.id}')">Reply</button>` : ''}
      </div>
      <div id="replybox-${c.id}" style="display:none;margin-top:.4rem">
        <input type="text" id="rinput-${c.id}" placeholder="Write a reply..." maxlength="200" />
        <button class="btn btn-primary btn-sm" style="margin-top:.3rem" onclick="addReply('${p.id}','${c.id}')">Reply</button>
      </div>
      ${(c.replies||[]).map(r => `
        <div class="comment reply">
          <div class="comment-head">
            <span class="comment-author">${sanitize(r.author)}</span>
            <span class="comment-time">${timeAgo(r.date)}</span>
          </div>
          <div>${sanitize(r.text)}</div>
          ${isAdmin ? `<div class="comment-actions"><button onclick="deleteReply('${p.id}','${c.id}','${r.id}')">Delete</button></div>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}

function toggleReaction(id) {
  const posts = store.get('posts', []);
  const p = posts.find(x => x.id === id);
  p.reactedByMe = !p.reactedByMe;
  p.reactions = (p.reactions || 0) + (p.reactedByMe ? 1 : -1);
  store.set('posts', posts);
  renderPosts();
}
function toggleCommentBox(id) {
  const box = document.getElementById('commentbox-' + id);
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
function addComment(id) {
  const input = document.getElementById('cinput-' + id);
  const text = sanitize(input.value.trim());
  if (!text) return;
  const posts = store.get('posts', []);
  const p = posts.find(x => x.id === id);
  p.comments = p.comments || [];
  p.comments.push({ id: 'c' + Date.now(), author: 'Student', text, date: Date.now(), replies: [] });
  store.set('posts', posts);
  input.value = '';
  renderPosts();
  toast('Comment posted', 'success');
}
function showReplyBox(cid) {
  const box = document.getElementById('replybox-' + cid);
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
function addReply(pid, cid) {
  const input = document.getElementById('rinput-' + cid);
  const text = sanitize(input.value.trim());
  if (!text) return;
  const posts = store.get('posts', []);
  const p = posts.find(x => x.id === pid);
  const c = p.comments.find(x => x.id === cid);
  c.replies = c.replies || [];
  c.replies.push({ id: 'r' + Date.now(), author: 'Teacher', text, date: Date.now() });
  store.set('posts', posts);
  renderPosts();
  toast('Reply posted', 'success');
}
function deleteComment(pid, cid) {
  if (!confirm('Delete this comment?')) return;
  const posts = store.get('posts', []);
  const p = posts.find(x => x.id === pid);
  p.comments = p.comments.filter(c => c.id !== cid);
  store.set('posts', posts);
  renderPosts();
  toast('Comment deleted');
}
function deleteReply(pid, cid, rid) {
  if (!confirm('Delete this reply?')) return;
  const posts = store.get('posts', []);
  const p = posts.find(x => x.id === pid);
  const c = p.comments.find(x => x.id === cid);
  c.replies = c.replies.filter(r => r.id !== rid);
  store.set('posts', posts);
  renderPosts();
}
function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  let posts = store.get('posts', []);
  posts = posts.filter(p => p.id !== id);
  store.set('posts', posts);
  renderPosts();
  toast('Post deleted');
}
function openPostModal(editId) {
  const posts = store.get('posts', []);
  const p = editId ? posts.find(x => x.id === editId) : null;
  openModal(p ? 'Edit Announcement' : 'New Announcement', `
    <div class="form-group"><label>Title</label><input id="pTitle" value="${p?sanitize(p.title):''}" maxlength="120" /></div>
    <div class="form-group"><label>Content</label><textarea id="pContent" rows="5" maxlength="1000">${p?sanitize(p.content):''}</textarea></div>
    <button class="btn btn-primary" onclick="savePost('${editId||''}')">${p?'Update':'Publish'}</button>
  `);
}
function editPost(id) { openPostModal(id); }
function savePost(editId) {
  const title = sanitize(document.getElementById('pTitle').value.trim());
  const content = sanitize(document.getElementById('pContent').value.trim());
  if (!title || !content) { toast('Fill all fields', 'error'); return; }
  const posts = store.get('posts', []);
  if (editId) {
    const p = posts.find(x => x.id === editId);
    p.title = title; p.content = content;
  } else {
    posts.unshift({ id: 'p' + Date.now(), title, content, author: 'Teacher', date: Date.now(), reactions: 0, reactedByMe: false, comments: [] });
    pushNotification('New announcement: ' + title);
  }
  store.set('posts', posts);
  closeModal();
  renderPosts();
  toast('Saved!', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  updateAdminUI();
  renderPosts();
});