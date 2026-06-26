// ── API Service ─────────────────────────────────────────────────────────────
const API_BASE = '/api';

async function apiFetch(method, endpoint, data = null) {
  const token = localStorage.getItem('erms_token');
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  if (res.status === 401) { localStorage.removeItem('erms_token'); showLogin(); return null; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

const API = {
  login:  d  => apiFetch('POST', '/auth/login', d),
  logout: () => apiFetch('POST', '/auth/logout'),
  me:     () => apiFetch('GET',  '/auth/me'),

  dashStats: () => apiFetch('GET', '/dashboard/stats'),

  exams:          ()       => apiFetch('GET',    '/exams'),
  createExam:     d        => apiFetch('POST',   '/exams', d),
  updateExam:     (id,d)   => apiFetch('PUT',    `/exams/${id}`, d),
  deleteExam:     id       => apiFetch('DELETE', `/exams/${id}`),
  publishExam:    id       => apiFetch('POST',   `/exams/${id}/publish`),

  classes:        ()       => apiFetch('GET', '/classes'),
  createClass:    d        => apiFetch('POST','/classes', d),
  classSubjects:  id       => apiFetch('GET', `/classes/${id}/subjects`),

  students:       ()       => apiFetch('GET',    '/students'),
  createStudent:  d        => apiFetch('POST',   '/students', d),
  updateStudent:  (id,d)   => apiFetch('PUT',    `/students/${id}`, d),
  deleteStudent:  id       => apiFetch('DELETE', `/students/${id}`),

  marksSheet:   (eId,cId)  => apiFetch('GET',  `/marks?exam_id=${eId}&class_id=${cId}`),
  saveBulk:     d          => apiFetch('POST',  '/marks/bulk', d),

  results:      (eId,cId)  => apiFetch('GET',  `/results?exam_id=${eId}&class_id=${cId}`),
  computeResults: examId   => apiFetch('POST',  `/results/compute/${examId}`),
  resultCard:   (sId,eId)  => apiFetch('GET',  `/results/card?student_id=${sId}&exam_id=${eId}`),

  rechecks:     ()         => apiFetch('GET',  '/rechecks'),
  submitRecheck: d         => apiFetch('POST', '/rechecks', d),
  resolveRecheck:(id,d)    => apiFetch('PUT',  `/rechecks/${id}/resolve`, d),

  performance:  (eId,cId)  => apiFetch('GET',  `/reports/performance?exam_id=${eId}&class_id=${cId}`),

  auditLog:     entryId    => apiFetch('GET',  `/audit?entry_id=${entryId}`),
};
