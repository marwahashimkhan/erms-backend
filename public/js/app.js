let currentUser = null;
let currentPage = 'dashboard';

function setContent(html) { document.getElementById('page-content').innerHTML = html; }
function setTitle(t)      { document.getElementById('topbar-title').textContent = t; }
function setActions(html) { document.getElementById('topbar-actions').innerHTML = html; }
function loading()        { return `<div class="loading-box"><div class="spinner"></div><span>Loading…</span></div>`; }
function emptyState(icon, title, sub) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${sub}</p></div>`;
}
function badgeHtml(status) { return `<span class="badge badge-${status}">${status}</span>`; }
function gradeHtml(g) {
  const cls = {'A+':'g-Ap','A':'g-A','B+':'g-Bp','B':'g-B','C':'g-C','D':'g-D','F':'g-F'}[g]||'';
  return `<span class="${cls}">${g}</span>`;
}
function rankHtml(r) {
  const cls = r===1?'rk-1':r===2?'rk-2':r===3?'rk-3':'';
  return `<span class="${cls}">#${r}</span>`;
}

function showLogin()  { document.getElementById('page-login').classList.remove('hidden'); document.getElementById('page-app').classList.add('hidden'); }
function showApp()    { document.getElementById('page-login').classList.add('hidden');    document.getElementById('page-app').classList.remove('hidden'); }

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  btn.disabled = true; btn.textContent = 'Signing in…';
  errEl.classList.add('hidden');
  try {
    const data = await API.login({
      email:    document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    localStorage.setItem('erms_token', data.token);
    currentUser = data.user;
    document.getElementById('sidebar-user-name').textContent = currentUser.name;
    document.getElementById('sidebar-user-role').textContent = currentUser.role;
    showApp(); navigate('dashboard');
  } catch (err) {
    errEl.textContent = err.message || 'Invalid credentials';
    errEl.classList.remove('hidden');
  } finally { btn.disabled = false; btn.textContent = 'Sign In'; }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await API.logout().catch(() => {});
  localStorage.removeItem('erms_token');
  currentUser = null;
  showLogin();
});

const PAGE_TITLES = {
  dashboard:'Dashboard', students:'Students', exams:'Exams',
  marks:'Marks Entry', results:'Results', recheck:'Recheck Requests', reports:'Reports'
};
const PAGE_LOADERS = {
  dashboard: loadDashboard, students: loadStudents, exams: loadExams,
  marks: loadMarks, results: loadResults, recheck: loadRecheck, reports: loadReports
};

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
  setTitle(PAGE_TITLES[page] || page);
  setActions('');
  if (PAGE_LOADERS[page]) PAGE_LOADERS[page]();
}

document.getElementById('sidebar-nav').addEventListener('click', e => {
  const link = e.target.closest('.nav-link');
  if (link?.dataset.page) navigate(link.dataset.page);
});

(async () => {
  const token = localStorage.getItem('erms_token');
  if (!token) { showLogin(); return; }
  try {
    const data = await API.me();
    currentUser = data.user;
    document.getElementById('sidebar-user-name').textContent = currentUser.name;
    document.getElementById('sidebar-user-role').textContent = currentUser.role;
    showApp(); navigate('dashboard');
  } catch { showLogin(); }
})();
