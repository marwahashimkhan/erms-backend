async function loadDashboard() {
  setContent(loading());
  try {
    const d = await API.dashStats();
    setContent(`
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--fontD);font-size:26px;font-weight:800">Welcome back, ${currentUser?.name?.split(' ')[0] || 'Staff'} 👋</h1>
        <p style="font-size:13px;color:var(--text3);margin-top:4px">Here's your school overview for today.</p>
      </div>
      <div class="stat-grid">
        <div class="stat-card blue">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${d.totalStudents}</div>
          <div class="stat-hint">Across ${d.classes?.length || 0} classes</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Pass Rate</div>
          <div class="stat-value">${d.passRate}</div>
          <div class="stat-hint">Last published exam</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">Total Exams</div>
          <div class="stat-value">${d.totalExams}</div>
          <div class="stat-hint">${d.publishedExams} published</div>
        </div>
        <div class="stat-card sky">
          <div class="stat-label">Pending Rechecks</div>
          <div class="stat-value" style="color:${d.pendingRechecks>0?'var(--amber)':'var(--text)'}">${d.pendingRechecks}</div>
          <div class="stat-hint">${d.pendingRechecks>0?'Needs attention':'All clear'}</div>
        </div>
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <div><div class="card-title">Recent Exams</div><div class="card-sub">Latest activity</div></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                ${(d.recentExams||[]).map(e=>`
                  <tr>
                    <td style="font-weight:500">${e.title||e.exam_title}</td>
                    <td class="td-muted" style="text-transform:capitalize">${e.type||e.exam_type}</td>
                    <td>${badgeHtml(e.status)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Classes Overview</div></div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${(d.classes||[]).map(c=>`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg3);border-radius:var(--r)">
                <span style="font-size:13px;font-weight:500">${c.class_name} – ${c.section}</span>
                <span style="font-size:12px;color:var(--text2)">${c.student_count} students</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    `);
  } catch { setContent(`<div class="empty-state"><h3>Could not load dashboard</h3><p>Check API connection</p></div>`); }
}
