// ══════════════════════════════════════════════════════
//  STUDENTS
// ══════════════════════════════════════════════════════
let _classes = [];

async function loadStudents() {
  setContent(loading());
  setActions(`<button class="btn btn-primary" onclick="openAddStudent()">+ Add Student</button>`);
  try {
    const [sd, cd] = await Promise.all([API.students(), API.classes()]);
    _classes = cd || [];
    const students = sd || [];
    window._allStudents = students;
    setContent(`
      <div class="section-header">
        <div><h1 class="section-title">Students</h1><p class="section-sub">${students.length} enrolled</p></div>
      </div>
      <div class="filter-bar">
        <select class="form-select" id="filter-class-stu" style="min-width:170px" onchange="filterStudents()">
          <option value="">All Classes</option>
          ${_classes.map(c=>`<option value="${c.id}">${c.class_name} – ${c.section}</option>`).join('')}
        </select>
      </div>
      <div class="card" style="padding:0" id="students-table-wrap">
        ${buildStudentsTable(students)}
      </div>
    `);
  } catch { setContent(`<p style="color:var(--red);padding:20px">Failed to load students</p>`); }
}

function buildStudentsTable(students) {
  if (!students.length) return emptyState('👥','No students','Add students using the button above');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Roll No</th><th>Name</th><th>Class</th><th>Date of Birth</th><th>Actions</th></tr></thead>
    <tbody>
      ${students.map(s=>`<tr>
        <td class="td-mono td-muted">${s.roll_number}</td>
        <td style="font-weight:500">${s.student_name}</td>
        <td class="td-muted">${s.class_name||''} ${s.section?'– '+s.section:''}</td>
        <td class="td-mono td-muted">${s.date_of_birth||'—'}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="openEditStudent(${s.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">Delete</button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function filterStudents() {
  const val = document.getElementById('filter-class-stu')?.value;
  const filtered = val ? window._allStudents.filter(s=>String(s.class_id)===val) : window._allStudents;
  document.getElementById('students-table-wrap').innerHTML = buildStudentsTable(filtered);
}

function studentForm(s={}) {
  return `
    <div class="form-group"><label class="form-label">Class *</label>
      <select class="form-select" id="f-class-id">
        <option value="">Select class…</option>
        ${_classes.map(c=>`<option value="${c.id}" ${c.id==s.class_id?'selected':''}>${c.class_name} – ${c.section}</option>`).join('')}
      </select></div>
    <div class="form-group"><label class="form-label">Student Name *</label>
      <input class="form-input" id="f-name" placeholder="Full name" value="${s.student_name||''}" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Roll Number *</label>
        <input class="form-input" id="f-roll" placeholder="e.g. G9A-11" value="${s.roll_number||''}" /></div>
      <div class="form-group"><label class="form-label">Date of Birth</label>
        <input type="date" class="form-input" id="f-dob" value="${s.date_of_birth||''}" /></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-stu-btn" onclick="saveStudent(${s.id||0})">Save</button>
    </div>`;
}

function openAddStudent() { openModal('Add Student', studentForm()); }
function openEditStudent(id) {
  const s = window._allStudents.find(s=>s.id===id);
  if (s) openModal('Edit Student', studentForm(s));
}
async function saveStudent(id) {
  const d = { class_id:document.getElementById('f-class-id').value, student_name:document.getElementById('f-name').value, roll_number:document.getElementById('f-roll').value, date_of_birth:document.getElementById('f-dob').value };
  if (!d.class_id||!d.student_name||!d.roll_number){toast.error('Fill all required fields');return;}
  try {
    id ? await API.updateStudent(id,d) : await API.createStudent(d);
    toast.success(id?'Student updated':'Student added');
    closeModal(); loadStudents();
  } catch(e){toast.error(e.message||'Failed to save');}
}
async function deleteStudent(id){
  if(!confirm('Delete this student?'))return;
  try{await API.deleteStudent(id);toast.info('Student deleted');loadStudents();}
  catch{toast.error('Cannot delete — student has records');}
}

// ══════════════════════════════════════════════════════
//  EXAMS
// ══════════════════════════════════════════════════════
let _exams = [];

async function loadExams() {
  setContent(loading());
  setActions(`<button class="btn btn-primary" onclick="openCreateExam()">+ New Exam</button>`);
  try {
    _exams = await API.exams() || [];
    setContent(`
      <div class="section-header">
        <div><h1 class="section-title">Exams</h1><p class="section-sub">Manage all examinations</p></div>
      </div>
      <div class="card" style="padding:0">
        ${_exams.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Title</th><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${_exams.map(e=>`<tr>
            <td style="font-weight:500">${e.title||e.exam_title}</td>
            <td class="td-muted" style="text-transform:capitalize">${e.type||e.exam_type}</td>
            <td class="td-mono td-muted">${e.start_date}</td>
            <td class="td-mono td-muted">${e.end_date}</td>
            <td>${badgeHtml(e.status)}</td>
            <td><div style="display:flex;gap:6px">
              ${e.status!=='published'?`
                <button class="btn btn-success btn-sm" onclick="publishExam(${e.id},'${(e.title||e.exam_title).replace(/'/g,"\\'")}')">Publish</button>
                <button class="btn btn-secondary btn-sm" onclick="openEditExam(${e.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteExam(${e.id})">Delete</button>
              `:'<span style="font-size:12px;color:var(--text3)">Locked</span>'}
            </div></td>
          </tr>`).join('')}</tbody>
        </table></div>` : emptyState('📅','No exams','Create your first exam above')}
      </div>
    `);
  } catch { setContent(`<p style="color:var(--red);padding:20px">Failed to load exams</p>`); }
}

function examFormHtml(e={}) {
  return `
    <div class="form-group"><label class="form-label">Exam Title</label>
      <input class="form-input" id="f-title" placeholder="e.g. Mid-Term Examination 2024" value="${e.title||e.exam_title||''}" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Type</label>
        <select class="form-select" id="f-type">
          ${['unit','midterm','final','annual'].map(t=>`<option value="${t}" ${(e.type||e.exam_type)===t?'selected':''}>${t}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Start Date</label>
        <input type="date" class="form-input" id="f-start" value="${e.start_date||''}" /></div>
    </div>
    <div class="form-group"><label class="form-label">End Date</label>
      <input type="date" class="form-input" id="f-end" value="${e.end_date||''}" /></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveExam(${e.id||0})">Save Exam</button>
    </div>`;
}

function openCreateExam() { openModal('Create New Exam', examFormHtml()); }
function openEditExam(id) { const e=_exams.find(e=>e.id===id); if(e) openModal('Edit Exam',examFormHtml(e)); }
async function saveExam(id) {
  const d={exam_title:document.getElementById('f-title').value,exam_type:document.getElementById('f-type').value,start_date:document.getElementById('f-start').value,end_date:document.getElementById('f-end').value};
  if(!d.exam_title||!d.start_date||!d.end_date){toast.error('Fill all fields');return;}
  try{id?await API.updateExam(id,d):await API.createExam(d);toast.success(id?'Exam updated':'Exam created');closeModal();loadExams();}
  catch(e){toast.error(e.message||'Failed');}
}
function publishExam(id,title) {
  openModal('Publish Exam',`
    <p style="color:var(--text2);margin-bottom:16px">Publishing <strong style="color:var(--text)">${title}</strong> will lock all marks and compute final results.</p>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="confirmPublish(${id})">Confirm & Publish</button>
    </div>`);
}
async function confirmPublish(id){
  try{await API.publishExam(id);toast.success('Exam published — results computed!');closeModal();loadExams();}
  catch(e){toast.error(e.message||'Failed to publish');}
}
async function deleteExam(id){
  if(!confirm('Delete this exam?'))return;
  try{await API.deleteExam(id);toast.info('Exam deleted');loadExams();}
  catch(e){toast.error(e.message||'Cannot delete');}
}

// ══════════════════════════════════════════════════════
//  MARKS ENTRY
// ══════════════════════════════════════════════════════
let _marksExamId='', _marksClassId='', _localMarks={};

async function loadMarks() {
  let exams=[], classes=[];
  try{ [exams,classes] = await Promise.all([API.exams(),API.classes()]); } catch{}
  setContent(`
    <div class="section-header">
      <div><h1 class="section-title">Marks Entry</h1><p class="section-sub">Enter student marks per subject</p></div>
      <div id="marks-save-btn-wrap"></div>
    </div>
    <div class="filter-bar">
      <select class="form-select" id="marks-exam-sel" onchange="onMarksFilter()">
        <option value="">Select Exam…</option>
        ${exams.map(e=>`<option value="${e.id}" ${_marksExamId==e.id?'selected':''}>${e.title||e.exam_title} [${e.status}]</option>`).join('')}
      </select>
      <select class="form-select" id="marks-class-sel" onchange="onMarksFilter()">
        <option value="">Select Class…</option>
        ${classes.map(c=>`<option value="${c.id}" ${_marksClassId==c.id?'selected':''}>${c.class_name} – ${c.section}</option>`).join('')}
      </select>
    </div>
    <div id="marks-grid-area"></div>`);
  if (_marksExamId && _marksClassId) loadMarksGrid();
}

function onMarksFilter(){
  _marksExamId = document.getElementById('marks-exam-sel').value;
  _marksClassId= document.getElementById('marks-class-sel').value;
  if(_marksExamId && _marksClassId) loadMarksGrid();
}

async function loadMarksGrid(){
  document.getElementById('marks-grid-area').innerHTML = loading();
  document.getElementById('marks-save-btn-wrap').innerHTML = '';
  try{
    const data = await API.marksSheet(_marksExamId, _marksClassId);
    if(!data){document.getElementById('marks-grid-area').innerHTML=emptyState('✏️','No schedule','No exam schedule found for this combination');return;}
    _localMarks = {};
    (data.entries||[]).forEach(e=>{ _localMarks[`${e.schedule_id}_${e.student_id}`]={marks:e.marks_obtained,absent:!!e.is_absent}; });
    const locked = data.locked;
    document.getElementById('marks-grid-area').innerHTML = buildMarksGrid(data, locked);
    if(!locked) document.getElementById('marks-save-btn-wrap').innerHTML=`<button class="btn btn-primary" onclick="saveAllMarks()">💾 Save All Marks</button>`;
  } catch(e){document.getElementById('marks-grid-area').innerHTML=`<p style="color:var(--red);padding:20px">${e.message}</p>`;}
}

function buildMarksGrid(data, locked){
  const hd = (data.subjects||[]).map(s=>`<th>${s.subject_name}<br><span style="font-weight:400;font-size:10px">/${s.max_marks}</span></th>`).join('');
  const rows = (data.students||[]).map(stu=>{
    const cells = (data.subjects||[]).map(sub=>{
      const key=`${sub.schedule_id}_${stu.id}`;
      const val=_localMarks[key]||{};
      if(locked) return `<td class="td-mono" style="text-align:center">${val.absent?'<span style="color:var(--red)">AB</span>':(val.marks??'—')}</td>`;
      return `<td><div style="display:flex;flex-direction:column;align-items:center">
        <input type="number" class="marks-input" data-key="${key}" data-max="${sub.max_marks}"
          value="${val.marks??''}" min="0" max="${sub.max_marks}" ${val.absent?'disabled':''}
          oninput="onMarkInput(this)" />
        <label class="absent-lbl"><input type="checkbox" ${val.absent?'checked':''}
          onchange="onAbsent(this,'${key}')"> AB</label>
      </div></td>`;
    }).join('');
    return `<tr>
      <td><div style="font-weight:500;font-size:13px">${stu.student_name}</div>
          <div class="td-mono" style="font-size:11px;color:var(--text3)">${stu.roll_number}</div></td>
      ${cells}</tr>`;
  }).join('');
  return `
    <div class="card" style="padding:0">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="card-title">${data.exam_title||'Exam'}</div>
          <div class="card-sub">${data.class_name||''} – ${data.section||''} · ${(data.students||[]).length} students</div>
        </div>
        ${locked?'<span class="badge badge-published">Published — Read Only</span>':'<span class="badge badge-ongoing">Entry Mode</span>'}
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>Student</th>${hd}</tr></thead><tbody>${rows}</tbody></table>
      </div>
    </div>`;
}

function onMarkInput(inp){
  const max=parseInt(inp.dataset.max); const v=parseFloat(inp.value);
  inp.classList.toggle('err', isNaN(v)||v<0||v>max);
  if(_localMarks[inp.dataset.key]) _localMarks[inp.dataset.key].marks=inp.value;
  else _localMarks[inp.dataset.key]={marks:inp.value,absent:false};
}
function onAbsent(cb,key){
  const inp=document.querySelector(`.marks-input[data-key="${key}"]`);
  if(!_localMarks[key]) _localMarks[key]={};
  _localMarks[key].absent=cb.checked;
  if(inp){inp.disabled=cb.checked;if(cb.checked){inp.value=0;_localMarks[key].marks=0;}}
}
async function saveAllMarks(){
  const entries=Object.entries(_localMarks).map(([k,v])=>{
    const [sId,stuId]=k.split('_');
    return {schedule_id:parseInt(sId),student_id:parseInt(stuId),marks_obtained:parseFloat(v.marks)||0,is_absent:v.absent?1:0};
  });
  try{await API.saveBulk({entries});toast.success('All marks saved!');}
  catch(e){toast.error(e.message||'Save failed');}
}

// ══════════════════════════════════════════════════════
//  RESULTS
// ══════════════════════════════════════════════════════
let _resExamId='', _resClassId='';

async function loadResults(){
  let exams=[],classes=[];
  try{[exams,classes]=await Promise.all([API.exams(),API.classes()]);}catch{}
  setContent(`
    <div class="section-header">
      <div><h1 class="section-title">Results</h1><p class="section-sub">View class results and result cards</p></div>
      <div id="res-actions"></div>
    </div>
    <div class="filter-bar">
      <select class="form-select" id="res-exam-sel" onchange="onResFilter()">
        <option value="">Select Exam…</option>
        ${exams.map(e=>`<option value="${e.id}" ${_resExamId==e.id?'selected':''}>${e.title||e.exam_title}</option>`).join('')}
      </select>
      <select class="form-select" id="res-class-sel" onchange="onResFilter()">
        <option value="">Select Class…</option>
        ${classes.map(c=>`<option value="${c.id}" ${_resClassId==c.id?'selected':''}>${c.class_name} – ${c.section}</option>`).join('')}
      </select>
    </div>
    <div id="results-area">${emptyState('📊','Select exam and class','Results will appear here')}</div>`);
  if(_resExamId&&_resClassId) loadResultsData();
}
function onResFilter(){
  _resExamId=document.getElementById('res-exam-sel').value;
  _resClassId=document.getElementById('res-class-sel').value;
  if(_resExamId&&_resClassId) loadResultsData();
}
async function loadResultsData(){
  document.getElementById('results-area').innerHTML=loading();
  try{
    const results=await API.results(_resExamId,_resClassId)||[];
    if(!results.length){document.getElementById('results-area').innerHTML=emptyState('📊','No results','Compute results by publishing the exam');return;}
    const passing=results.filter(r=>r.is_pass).length;
    const avg=(results.reduce((s,r)=>s+parseFloat(r.total_pct),0)/results.length).toFixed(1);
    document.getElementById('res-actions').innerHTML=`<button class="btn btn-secondary" onclick="recomputeResults()">Recompute</button>`;
    document.getElementById('results-area').innerHTML=`
      <div class="stat-grid" style="margin-bottom:20px">
        <div class="stat-card blue"><div class="stat-label">Students</div><div class="stat-value">${results.length}</div></div>
        <div class="stat-card green"><div class="stat-label">Pass Rate</div><div class="stat-value">${Math.round(passing/results.length*100)}%</div></div>
        <div class="stat-card amber"><div class="stat-label">Class Avg</div><div class="stat-value">${avg}%</div></div>
        <div class="stat-card sky"><div class="stat-label">Failed</div><div class="stat-value" style="color:var(--red)">${results.length-passing}</div></div>
      </div>
      <div class="card" style="padding:0"><div class="table-wrap"><table>
        <thead><tr><th>Rank</th><th>Roll No</th><th>Student</th><th>Total</th><th>%</th><th>Grade</th><th>GPA</th><th>Status</th><th>Card</th></tr></thead>
        <tbody>${results.sort((a,b)=>a.class_rank-b.class_rank).map(r=>`<tr>
          <td>${rankHtml(r.class_rank)}</td>
          <td class="td-mono td-muted">${r.roll_number}</td>
          <td style="font-weight:500">${r.student_name}</td>
          <td class="td-mono">${r.total_marks}</td>
          <td class="td-mono">${r.total_pct}%</td>
          <td>${gradeHtml(r.grade)}</td>
          <td class="td-mono td-muted">${r.grade_point||'—'}</td>
          <td><span class="badge badge-${r.is_pass?'pass':'fail'}">${r.is_pass?'Pass':'Fail'}</span></td>
          <td><button class="btn btn-secondary btn-sm" onclick="viewResultCard(${r.student_id},${r.exam_id||_resExamId})">View</button></td>
        </tr>`).join('')}</tbody>
      </table></div></div>`;
  }catch(e){document.getElementById('results-area').innerHTML=`<p style="color:var(--red);padding:20px">${e.message}</p>`;}
}
async function recomputeResults(){
  try{await API.computeResults(_resExamId);toast.success('Results recomputed');loadResultsData();}
  catch(e){toast.error(e.message||'Failed');}
}
async function viewResultCard(stuId,examId){
  try{
    const c=await API.resultCard(stuId,examId);
    const subRows=(c.subjects||[]).map(s=>`<tr>
      <td>${s.subject_name}</td><td class="td-mono">${s.max_marks}</td>
      <td class="td-mono">${s.is_absent?'<span style="color:var(--red)">AB</span>':s.marks_obtained}</td>
      <td class="td-mono">${s.pct}%</td><td>${gradeHtml(s.grade)}</td>
    </tr>`).join('');
    openModal('Result Card',`
      <div class="result-card-wrap">
        <div class="rc-school">${c.school_name||'Beacon Public School'}</div>
        <div class="rc-sub">Official Result Card · ${c.year_label||''}</div>
        <div style="text-align:center;font-size:13px;color:var(--text2);margin-top:6px">${c.exam_title}</div>
        <hr class="divider">
        <div class="rc-info">
          <div class="rc-info-item"><label>Student</label><span>${c.student_name}</span></div>
          <div class="rc-info-item"><label>Roll No</label><span>${c.roll_number}</span></div>
          <div class="rc-info-item"><label>Class</label><span>${c.class_name}–${c.section}</span></div>
        </div>
        <div class="table-wrap" style="margin-bottom:14px">
          <table><thead><tr><th>Subject</th><th>Max</th><th>Obtained</th><th>%</th><th>Grade</th></tr></thead>
          <tbody>${subRows}</tbody></table>
        </div>
        <div class="rc-summary">
          <div class="rc-summary-item"><label>Total</label><div class="val">${c.total_marks}</div></div>
          <div class="rc-summary-item"><label>Percentage</label><div class="val" style="color:var(--accent2)">${c.total_pct}%</div></div>
          <div class="rc-summary-item"><label>Grade</label><div class="val">${gradeHtml(c.grade)}</div></div>
          <div class="rc-summary-item"><label>Rank</label><div class="val" style="color:var(--amber)">#${c.class_rank}</div></div>
        </div>
        <div class="rc-status" style="background:${c.is_pass?'var(--greenDim)':'var(--redDim)'};color:${c.is_pass?'var(--green)':'var(--red)'}">
          ${c.is_pass?'✓ PASS':'✕ FAIL'}
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        <button class="btn btn-primary" onclick="window.print()">🖨 Print</button>
      </div>`,true);
  }catch(e){toast.error(e.message||'Card not available');}
}

// ══════════════════════════════════════════════════════
//  RECHECK
// ══════════════════════════════════════════════════════
let _allStudentsRC=[];

async function loadRecheck(){
  setContent(loading());
  setActions(`<button class="btn btn-primary" onclick="openNewRecheck()">+ New Request</button>`);
  try{
    const [rr,sr]=await Promise.all([API.rechecks(),API.students()]);
    _allStudentsRC=sr||[];
    const reqs=rr||[];
    setContent(`
      <div class="section-header">
        <div><h1 class="section-title">Recheck Requests</h1><p class="section-sub">Manage marks review requests</p></div>
      </div>
      <div class="card" style="padding:0">
        ${reqs.length?`<div class="table-wrap"><table>
          <thead><tr><th>Student</th><th>Reason</th><th>Original</th><th>Revised</th><th>Requested</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${reqs.map(r=>`<tr>
            <td style="font-weight:500">${r.student_name||'—'}</td>
            <td style="color:var(--text2);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.reason}</td>
            <td class="td-mono">${r.original_marks??'—'}</td>
            <td class="td-mono">${r.revised_marks??'—'}</td>
            <td class="td-mono td-muted">${(r.requested_at||'').split('T')[0]}</td>
            <td>${badgeHtml(r.status)}</td>
            <td><div style="display:flex;gap:6px">
              ${r.status==='pending'?`<button class="btn btn-success btn-sm" onclick="openResolve(${r.id},${r.original_marks||0},'${(r.student_name||'').replace(/'/g,"\\'")}','${(r.reason||'').replace(/'/g,"\\'")}')">Resolve</button>`:''}
              <button class="btn btn-secondary btn-sm" onclick="viewAudit(${r.entry_id})">Audit</button>
            </div></td>
          </tr>`).join('')}</tbody>
        </table></div>`:emptyState('🔍','No recheck requests','All marks have been accepted')}
      </div>`);
  }catch{setContent(`<p style="color:var(--red);padding:20px">Failed to load</p>`);}
}
function openNewRecheck(){
  openModal('Submit Recheck Request',`
    <div class="form-group"><label class="form-label">Student</label>
      <select class="form-select" id="rc-stu">
        <option value="">Select student…</option>
        ${_allStudentsRC.map(s=>`<option value="${s.id}">${s.student_name} (${s.roll_number})</option>`).join('')}
      </select></div>
    <div class="form-group"><label class="form-label">Reason</label>
      <textarea class="form-textarea" id="rc-reason" placeholder="Describe the marking discrepancy…"></textarea></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitRecheck()">Submit Request</button>
    </div>`);
}
async function submitRecheck(){
  const stuId=document.getElementById('rc-stu').value;
  const reason=document.getElementById('rc-reason').value.trim();
  if(!stuId||!reason){toast.error('Fill all fields');return;}
  try{await API.submitRecheck({student_id:stuId,reason});toast.success('Request submitted');closeModal();loadRecheck();}
  catch(e){toast.error(e.message||'Failed');}
}
function openResolve(id,orig,name,reason){
  openModal('Resolve Recheck',`
    <div style="padding:10px 0 14px;border-bottom:1px solid var(--border);margin-bottom:14px">
      <p style="font-size:13px;color:var(--text2)">Student: <strong style="color:var(--text)">${name}</strong></p>
      <p style="font-size:13px;color:var(--text2);margin-top:4px">Original marks: <strong style="color:var(--text)">${orig}</strong></p>
      <p style="font-size:13px;color:var(--text2);margin-top:4px">Reason: ${reason}</p>
    </div>
    <div class="form-group"><label class="form-label">Revised Marks</label>
      <input type="number" class="form-input" id="rc-revised" value="${orig}" min="0" max="100" /></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="confirmResolve(${id})">Resolve & Update</button>
    </div>`);
}
async function confirmResolve(id){
  const m=parseFloat(document.getElementById('rc-revised').value);
  if(isNaN(m)){toast.error('Invalid marks');return;}
  try{await API.resolveRecheck(id,{revised_marks:m});toast.success('Recheck resolved');closeModal();loadRecheck();}
  catch(e){toast.error(e.message||'Failed');}
}
async function viewAudit(entryId){
  try{
    const logs=await API.auditLog(entryId)||[];
    openModal('Audit Trail', logs.length
      ? logs.map(l=>`<div class="audit-item">
          <div class="audit-dot"></div>
          <div>
            <div class="audit-text"><strong>${l.old_marks}</strong> → <strong style="color:var(--green)">${l.new_marks}</strong> · ${l.change_reason}</div>
            <div class="audit-time">${(l.changed_at||'').replace('T',' ').split('.')[0]} · ${l.staff_name||'System'}</div>
          </div></div>`).join('')
      : '<p style="color:var(--text3);font-size:13px">No audit records found.</p>');
  }catch{toast.error('Could not load audit log');}
}

// ══════════════════════════════════════════════════════
//  REPORTS
// ══════════════════════════════════════════════════════
let _rpExamId='',_rpClassId='';

async function loadReports(){
  let exams=[],classes=[];
  try{[exams,classes]=await Promise.all([API.exams(),API.classes()]);}catch{}
  setContent(`
    <div class="section-header">
      <div><h1 class="section-title">Reports</h1><p class="section-sub">Performance analytics</p></div>
    </div>
    <div class="filter-bar">
      <select class="form-select" id="rp-exam-sel" onchange="onRpFilter()">
        <option value="">Select Exam…</option>
        ${exams.map(e=>`<option value="${e.id}" ${_rpExamId==e.id?'selected':''}>${e.title||e.exam_title}</option>`).join('')}
      </select>
      <select class="form-select" id="rp-class-sel" onchange="onRpFilter()">
        <option value="">Select Class…</option>
        ${classes.map(c=>`<option value="${c.id}" ${_rpClassId==c.id?'selected':''}>${c.class_name} – ${c.section}</option>`).join('')}
      </select>
    </div>
    <div id="report-area">${emptyState('📈','Select exam and class','Performance summary will appear here')}</div>`);
  if(_rpExamId&&_rpClassId) loadReportData();
}
function onRpFilter(){
  _rpExamId=document.getElementById('rp-exam-sel').value;
  _rpClassId=document.getElementById('rp-class-sel').value;
  if(_rpExamId&&_rpClassId) loadReportData();
}
async function loadReportData(){
  document.getElementById('report-area').innerHTML=loading();
  try{
    const p=await API.performance(_rpExamId,_rpClassId);
    const COLORS={'A+':'#a78bfa','A':'#34d399','B+':'#38bdf8','B':'#60a5fa','C':'#fbbf24','D':'#f97316','F':'#f87171'};
    const gradeVals=Object.values(p.grade_distribution||{0:1});
    const maxGrade=Math.max(...gradeVals,1);
    const subVals=Object.values(p.subject_averages||{0:1});
    const maxSub=Math.max(...subVals,1);
    const gradeBars=Object.entries(p.grade_distribution||{}).map(([g,c])=>`
      <div class="chart-bar-row">
        <div class="chart-bar-label">${g}</div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(c/maxGrade*100)}%;background:${COLORS[g]||'#7c6dfa'}">${c}</div></div>
        <div class="chart-bar-val">${c}</div>
      </div>`).join('');
    const subBars=Object.entries(p.subject_averages||{}).map(([s,a])=>`
      <div class="chart-bar-row">
        <div class="chart-bar-label">${s.substring(0,5)}</div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(a/maxSub*100)}%;background:#7c6dfa">${a}%</div></div>
        <div class="chart-bar-val">${a}%</div>
      </div>`).join('');
    document.getElementById('report-area').innerHTML=`
      <div class="stat-grid" style="margin-bottom:20px">
        <div class="stat-card blue"><div class="stat-label">Class Average</div><div class="stat-value">${p.avg_percentage}%</div></div>
        <div class="stat-card green"><div class="stat-label">Pass Rate</div><div class="stat-value">${p.pass_rate}%</div></div>
        <div class="stat-card amber"><div class="stat-label">Passed</div><div class="stat-value">${p.passed}</div><div class="stat-hint">of ${p.total} students</div></div>
        <div class="stat-card sky"><div class="stat-label">Failed</div><div class="stat-value" style="color:var(--red)">${p.failed}</div></div>
      </div>
      <div class="two-col" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header"><div class="card-title">Grade Distribution</div></div>
          <div class="chart-wrap">${gradeBars}</div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Subject Averages</div></div>
          <div class="chart-wrap">${subBars}</div>
        </div>
      </div>
      ${p.top3?.length?`<div class="card">
        <div class="card-header"><div class="card-title">Top Performers</div></div>
        ${p.top3.map((s,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg3);border-radius:var(--r);margin-bottom:8px">
          <span style="font-family:var(--fontD);font-size:22px;font-weight:700;color:${['#fbbf24','#9ca3af','#f97316'][i]}">#${i+1}</span>
          <div><div style="font-weight:500;font-size:13px">${s.student_name}</div><div style="font-size:12px;color:var(--text3)">${s.total_pct}% · Grade ${s.grade}</div></div>
        </div>`).join('')}
      </div>`:''}`;
  }catch(e){document.getElementById('report-area').innerHTML=`<p style="color:var(--red);padding:20px">${e.message}</p>`;}
}
