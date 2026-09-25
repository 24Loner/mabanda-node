const app = document.querySelector('#app');

const state = { loggedIn: false, view: 'dashboard' };
const SCHOOL_NAME = 'ATLANTIC BILINGUAL COLLEGE MABANDA';
const students = [
  ['ST-2401', 'Amelia Nfor', 'Form 3A', 'Mathematics', '18 / 20', 'Excellent'],
  ['ST-2402', 'Daniel Tanyi', 'Form 3A', 'Mathematics', '16 / 20', 'Very good'],
  ['ST-2403', 'Grace Mbida', 'Form 3A', 'Mathematics', '15 / 20', 'Very good'],
  ['ST-2404', 'Michael Fong', 'Form 3A', 'Mathematics', '13 / 20', 'Good'],
  ['ST-2405', 'Sarah Ewane', 'Form 3A', 'Mathematics', '12 / 20', 'Good']
];

function icon(value) { return `<span class="nav-icon">${value}</span>`; }
function normalizeSchoolDisplay() {
  const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => { node.nodeValue = node.nodeValue.replaceAll('Mabanda Secondary School', SCHOOL_NAME).replaceAll('Sign in to Mabanda', `Sign in to ${SCHOOL_NAME}`).replaceAll('Register your Mabanda teaching account', `Register your ${SCHOOL_NAME} teaching account`).replaceAll('your Mabanda teaching account', `your ${SCHOOL_NAME} teaching account`); });
}
function layout(content) {
  const nav = [
    ['dashboard', '⌂', 'Overview'], ['results', '◈', 'Result entry'], ['students', '◇', 'Students'], ['teachers', '♙', 'Teachers'], ['classes', '▦', 'Classes'], ['subjects', '✎', 'Subjects'],
    ['reports', '▤', 'Report cards'], ['analytics', '◒', 'Analytics'], ['assignments', '⇄', 'Assignments'], ['settings', '⚙', 'Settings']
  ];
  const user = state.user || { full_name: 'Admin Nfor', role: 'administrator' };
  const initials = user.full_name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const visibleNav = (user.role === 'administrator' || user.role === 'admin') ? nav : nav.filter(([id]) => !['assignments', 'classes', 'teachers'].includes(id));
  return `<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">M</div><div>ATLANTIC BILINGUAL COLLEGE MABANDA<small>Academic OS</small></div></div><div class="nav-label">Workspace</div><nav class="nav-list">${visibleNav.map(([id, glyph, label]) => `<button class="nav-item ${state.view === id ? 'active' : ''}" data-view="${id}">${icon(glyph)}<span>${label}</span></button>`).join('')}</nav><div class="sidebar-footer"><div class="profile-mini"><div class="avatar">${initials}</div><div><strong style="color:var(--text);display:block;font-size:12px">${user.full_name}</strong><span>${user.role.replace('_', ' ')}</span></div></div></div></aside><main class="main">${content}</main></div>`;
}
function header(kicker, title, copy, action = '') { return `<header class="topbar"><div><p class="eyebrow">${kicker}</p><h1 class="page-title">${title}</h1><p class="page-subtitle">${copy}</p></div><div class="top-actions"><button class="icon-btn" title="Notifications">♢</button>${action}</div></header>`; }
function stat(label, value, trend, glyph) { return `<article class="panel stat-card"><div class="stat-head"><span>${label}</span><span class="stat-glyph">${glyph}</span></div><div class="stat-value">${value}</div><div class="stat-trend">${trend}</div></article>`; }
function dashboard() { return `<div class="view">${header('Wednesday, 16 September 2026', 'Good morning, Admin', 'Here is the academic pulse across Mabanda Secondary School.', '<button class="primary-btn" data-view="results">+ Enter results</button>')}<section class="grid stats-grid">${stat('Total students', '1,248', '+8.2% this term', '◇')}${stat('School average', '68.4%', '+3.6% vs last sequence', '◒')}${stat('Results completed', '86%', '24 classes reporting', '✓')}${stat('Active teachers', '64', 'All assignments current', '◌')}</section><section class="grid split-grid"><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Performance overview</h2><p class="panel-note">Average score by class · First sequence 2026/27</p></div><button class="outline-btn">This sequence⌄</button></div><div class="panel-body"><div class="chart">${[['F1A', 58], ['F1B', 66], ['F2A', 62], ['F2B', 72], ['F3A', 79], ['F4A', 68], ['F5A', 74], ['L6', 82]].map(([label, height], i) => `<div class="bar-wrap"><div class="bar" style="height:${height * 2}px;animation-delay:${i * .06}s"></div><span class="bar-label">${label}</span></div>`).join('')}</div><div class="legend"><span><i class="dot"></i>Class average</span><span><i class="dot violet"></i>Target: 70%</span></div></div></article><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Recent activity</h2><p class="panel-note">Latest updates from your school</p></div></div><div class="panel-body activity-list"><div class="activity"><div class="activity-icon">✓</div><div class="activity-text"><b style="color:var(--text)">Form 3A results submitted</b><span class="activity-time">Mr. John · 12 minutes ago</span></div></div><div class="activity"><div class="activity-icon">↗</div><div class="activity-text"><b style="color:var(--text)">Report cards generated</b><span class="activity-time">Form 2B · 48 minutes ago</span></div></div><div class="activity"><div class="activity-icon">+</div><div class="activity-text"><b style="color:var(--text)">New student registered</b><span class="activity-time">ST-2408 · 2 hours ago</span></div></div></div></article></section><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Classes needing attention</h2><p class="panel-note">Completion and average score by class</p></div><button class="outline-btn" data-view="analytics">View analytics</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Class</th><th>Class master</th><th>Students</th><th>Average</th><th>Completion</th><th>Status</th></tr></thead><tbody>${[['Form 1A','Mrs. Sarah','42','58.2%','92%','On track'],['Form 2B','Mr. Peter','38','64.7%','71%','Pending'],['Form 3A','Mrs. Mary','40','72.8%','100%','Complete']].map(row => `<tr><td class="student-name">${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td style="color:var(--text)">${row[3]}</td><td>${row[4]}</td><td><span class="status ${row[5] === 'Pending' ? 'pending' : ''}">${row[5]}</span></td></tr>`).join('')}</tbody></table></div></section></div>`; }

function genericPage(title, copy, label) { return `<div class="view">${header(label, title, copy, '<button class="primary-btn" data-toast="Action queued">+ Add new</button>')}<article class="panel"><div class="toolbar" style="padding:20px 22px 0"><input class="search" placeholder="Search records..."><button class="outline-btn">Filter⌄</button></div><div class="empty">This workspace is ready for your ${title.toLowerCase()} data.<br><span style="font-size:12px;color:#61718a">Connect the secure application API here without changing the visual system.</span></div></article></div>`; }
function reportsPage() {
  return `<div class="view">${header('Administration', 'Report cards', 'Review compiled marks across all registered subjects and print student report cards.', '<button class="outline-btn" data-view="settings">Submitted reports</button>')}<article class="panel"><div class="panel-body"><div class="form-grid"><select class="select" id="reports-year"><option>Loading years...</option></select><select class="select" id="reports-term"><option>Choose term...</option></select><select class="select" id="reports-sequence"><option>Choose sequence...</option></select><select class="select" id="reports-class"><option value="">All classes</option></select><div style="display:flex;gap:8px;align-items:center"><input class="field" id="reports-search" placeholder="Search student name or ID"><button class="primary-btn" id="reports-search-btn" type="button">Search</button><button class="outline-btn" id="reports-refresh-btn" type="button">Refresh</button></div></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="primary-btn" id="print-class-reports" disabled>Print all class report cards</button></div></div></article><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Compiled student marks</h2><p class="panel-note" id="reports-summary">Choose a reporting period to load compiled results.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Position</th><th>Student</th><th>Student ID</th><th>Class</th><th>Subjects</th><th>Average</th><th>Status</th><th>Print</th></tr></thead><tbody id="reports-list"><tr><td colspan="8" class="empty">Select a year, term and sequence.</td></tr></tbody></table></div></article></div>`;
}
async function hydrateReports() {
  if (window.location.protocol === 'file:') return;
  const yearSelect = document.querySelector('#reports-year');
  const termSelect = document.querySelector('#reports-term');
  const sequenceSelect = document.querySelector('#reports-sequence');
  const classSelect = document.querySelector('#reports-class');
  const searchInput = document.querySelector('#reports-search');
  const searchButton = document.querySelector('#reports-search-btn');
  const refreshButton = document.querySelector('#reports-refresh-btn');
  const bulkButton = document.querySelector('#print-class-reports');
  const list = document.querySelector('#reports-list');
  const summary = document.querySelector('#reports-summary');
  try {
    const [years, classes] = await Promise.all([apiRequest('/api/academic-years'), apiRequest('/api/classes')]);
    yearSelect.innerHTML = years.academic_years.map(item => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('');
    classSelect.innerHTML = '<option value="">All classes</option>' + classes.classes.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
    const loadTerms = async () => {
      const terms = await apiRequest(`/api/terms?academic_year_id=${yearSelect.value}`);
      termSelect.innerHTML = terms.terms.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('') || '<option value="">No terms found</option>';
      await loadSequences();
    };
    const loadSequences = async () => {
      const sequences = await apiRequest(`/api/sequences?academic_year_id=${yearSelect.value}&term_id=${termSelect.value}`);
      sequenceSelect.innerHTML = sequences.sequences.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('') || '<option value="">No sequences found</option>';
      await loadReports();
    };
    const loadReports = async () => {
      if (!termSelect.value || !sequenceSelect.value) return;
      const params = new URLSearchParams({ academic_year_id: yearSelect.value, term_id: termSelect.value, sequence_id: sequenceSelect.value, class_id: classSelect.value, search: searchInput.value });
      const response = await apiRequest(`/api/admin/reports?${params}`);
      list.innerHTML = response.reports.map(item => `<tr><td>${item.position}</td><td class="student-name">${escapeHtml(item.student_name)}</td><td>${escapeHtml(item.student_number)}</td><td>${escapeHtml(item.class_name)}</td><td>${item.subjects}</td><td class="student-name">${item.average}%</td><td><span class="status ${item.submitted ? 'approved' : 'pending'}">${item.submitted ? 'Ready' : 'Incomplete'}</span></td><td><button class="outline-btn report-download" data-student="${item.student_id}" data-class="${item.class_id}">Print PDF</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty">No compiled marks found for these filters.</td></tr>';
      summary.textContent = `${response.reports.length} compiled student report${response.reports.length === 1 ? '' : 's'} found.`;
      list.querySelectorAll('.report-download').forEach(button => button.addEventListener('click', async () => {
        try {
          const blob = await apiRequest('/api/report-cards', { method: 'POST', body: JSON.stringify({ student_id: Number(button.dataset.student), class_id: Number(button.dataset.class), academic_year_id: Number(yearSelect.value), term_id: Number(termSelect.value), sequence_id: Number(sequenceSelect.value) }) });
          const link = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          link.href = objectUrl;
          link.download = `report-card-${button.dataset.student}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(objectUrl);
        } catch (error) { alert(error.message); }
      }));
    };
    yearSelect.addEventListener('change', loadTerms);
    termSelect.addEventListener('change', loadSequences);
    sequenceSelect.addEventListener('change', loadReports);
    classSelect.addEventListener('change', loadReports);
    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim() === '') loadReports();
    });
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadReports();
      }
    });
    searchButton.addEventListener('click', loadReports);
    refreshButton.addEventListener('click', () => {
      searchInput.value = '';
      loadReports();
    });
    classSelect.addEventListener('change', () => { bulkButton.disabled = !classSelect.value; });
    bulkButton.addEventListener('click', async () => {
      if (!classSelect.value) return;
      bulkButton.disabled = true;
      bulkButton.textContent = 'Preparing PDFs...';
      try {
        const blob = await apiRequest('/api/report-cards/bulk', { method: 'POST', body: JSON.stringify({ class_id: Number(classSelect.value), academic_year_id: Number(yearSelect.value), term_id: Number(termSelect.value), sequence_id: Number(sequenceSelect.value) }) });
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = `class-report-cards-${classSelect.value}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
      } catch (error) { alert(error.message); }
      finally { bulkButton.disabled = !classSelect.value; bulkButton.textContent = 'Print all class report cards'; }
    });
    await loadTerms();
  } catch (error) { list.innerHTML = `<tr><td colspan="8" class="empty" style="color:var(--danger)">${escapeHtml(error.message)}</td></tr>`; }
}
function assignmentsPage() {
  return `<div class="view">${header('Administration', 'Teacher assignments', 'Assign available teachers to multiple subjects and classes, edit, or remove existing assignments.', '<button class="outline-btn" data-view="dashboard">Back to overview</button>')}<article class="panel"><div class="panel-header"><div><h2 class="panel-title" id="assignment-form-title">Create assignment</h2><p class="panel-note">Select multiple subjects and click the classes where the teacher teaches them.</p></div></div><div class="panel-body"><div class="form-grid"><select class="select" id="assignment-teacher"><option>Loading teachers...</option></select><select class="select" id="assignment-subject" multiple size="4"><option>Loading subjects...</option></select><div><label class="field-label" style="margin-top:0">Classes</label><div class="selection-list" id="assignment-class-list"><span class="panel-note">Loading classes...</span></div></div></div><label class="check" style="margin:4px 0 16px"><input type="checkbox" id="assignment-all-classes"> Apply selected subjects to all active classes</label><div><button class="primary-btn" id="save-assignment">Assign teacher</button><button class="outline-btn" id="cancel-edit-assignment" style="display:none;margin-left:8px">Cancel</button></div><p class="panel-note" id="assignment-message" style="margin-top:12px"></p></div></article><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Active assignments</h2><p class="panel-note">Teachers can only enter marks for rows assigned here.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Teacher</th><th>Subject</th><th>Class</th><th>Academic year</th><th>Status</th><th>Actions</th></tr></thead><tbody id="assignment-list"><tr><td colspan="6" class="empty">Loading assignments...</td></tr></tbody></table></div></article></div>`;
}

function classesPage() {
  return `<div class="view">${header('Administration', 'Classes', 'Create, edit, assign class masters, or delete classes.', '<button class="outline-btn" data-view="dashboard">Back to overview</button>')}<article class="panel"><div class="panel-header"><div><h2 class="panel-title" id="class-form-title">Create class</h2><p class="panel-note">Each class belongs to one academic year and can have one class master.</p></div></div><div class="panel-body"><div class="form-grid"><input class="field" id="new-class-name" placeholder="Class name, e.g. Form 5A"><select class="select" id="new-class-year"><option>Loading academic years...</option></select><select class="select" id="new-class-master"><option>Loading class masters...</option></select></div><div style="margin-top:12px"><button class="primary-btn" id="save-class">Create class</button><button class="outline-btn" id="cancel-edit-class" style="display:none;margin-left:8px">Cancel</button></div><p class="panel-note" id="class-form-message" style="margin-top:12px"></p></div></article><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Active classes</h2><p class="panel-note">Classes are available for student enrollment and teacher assignments.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Class</th><th>Academic year</th><th>Class master</th><th>Status</th><th>Actions</th></tr></thead><tbody id="class-list"><tr><td colspan="5" class="empty">Loading classes...</td></tr></tbody></table></div></article></div>`;
}

function subjectsPage() {
  return `<div class="view">${header('Administration','Subjects','Create, edit, and deactivate subjects.', '<button class="outline-btn" data-view="dashboard">Back to overview</button>')}</div>
    <article class="panel">
      <div class="panel-header"><div><h2 class="panel-title" id="subject-form-title">Add subject</h2><p class="panel-note">Define subject details.</p></div></div>
      <div class="panel-body">
        <div class="form-grid">
          <input class="field" id="new-subject-name" placeholder="Subject name">
          <input class="field" id="new-subject-code" placeholder="Subject code">
          <input class="field" id="new-subject-max" placeholder="Max mark" type="number" min="1">
          <input class="field" id="new-subject-coef" placeholder="Coefficient" type="number" step="0.1" min="0">
          <input class="field" id="new-subject-category" placeholder="Category">
          <label class="check"><input type="checkbox" id="new-subject-active" checked>Active</label>
          <button class="primary-btn" id="save-subject">Create subject</button>
          <button class="outline-btn" id="cancel-edit-subject" style="display:none">Cancel</button>
          <p class="panel-note" id="subject-form-message" style="margin-top:12px"></p>
        </div>
      </div>
    </article>
    <article class="panel" style="margin-top:16px">
      <div class="panel-header"><div><h2 class="panel-title">Active subjects</h2><p class="panel-note">Manage existing subjects.</p></div></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Code</th><th>Max</th><th>Coeff</th><th>Category</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="subject-list"></tbody>
        </table>
      </div>
    </article>`;
}
function teachersPage() {
  return `<div class="view">${header('Administration', 'Teachers', 'Create, manage, and deactivate teacher accounts.', '<button class="outline-btn" data-view="dashboard">Back to overview</button>')}<article class="panel"><div class="panel-header"><div><h2 class="panel-title">Add teacher</h2><p class="panel-note">The teacher can sign in immediately, then receive subject and class assignments.</p></div></div><div class="panel-body"><div class="form-grid"><input class="field" id="new-teacher-name" placeholder="Full name"><input class="field" id="new-teacher-email" type="email" placeholder="Email address"><input class="field" id="new-teacher-password" type="password" placeholder="Initial password"></div><button class="primary-btn" id="save-teacher">Create teacher account</button><p class="panel-note" id="teacher-form-message" style="margin-top:12px"></p></div></article><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Active teachers</h2><p class="panel-note">Deactivating a teacher also removes active subject/class assignments.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Assignments</th><th>Status</th><th>Action</th></tr></thead><tbody id="teacher-list"><tr><td colspan="5" class="empty">Loading teachers...</td></tr></tbody></table></div></article></div>`;
}

async function hydrateTeachers() {
  if (window.location.protocol === 'file:') return;
  try {
    const renderTeachers = records => { document.querySelector('#teacher-list').innerHTML = records.map(item => `<tr><td class="student-name">${escapeHtml(item.full_name)}</td><td>${escapeHtml(item.email)}</td><td>${item.assignment_count || 0}</td><td><span class="status">Active</span></td><td><button class="outline-btn deactivate-teacher" data-teacher-id="${item.id}">Remove</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No active teachers found.</td></tr>'; document.querySelectorAll('.deactivate-teacher').forEach(button => button.addEventListener('click', async () => { if (!confirm('Deactivate this teacher and remove active assignments?')) return; await apiRequest(`/api/admin/teachers/${button.dataset.teacherId}`, { method: 'DELETE' }); const refreshed = await apiRequest('/api/admin/teachers'); renderTeachers(refreshed.teachers); })); };
    const response = await apiRequest('/api/admin/teachers'); renderTeachers(response.teachers);
    document.querySelector('#save-teacher').addEventListener('click', async () => { const message = document.querySelector('#teacher-form-message'); try { await apiRequest('/api/admin/teachers', { method: 'POST', body: JSON.stringify({ full_name: document.querySelector('#new-teacher-name').value, email: document.querySelector('#new-teacher-email').value, password: document.querySelector('#new-teacher-password').value }) }); message.textContent = 'Teacher account created successfully.'; message.style.color = 'var(--positive)'; document.querySelector('#new-teacher-name').value = ''; document.querySelector('#new-teacher-email').value = ''; document.querySelector('#new-teacher-password').value = ''; const refreshed = await apiRequest('/api/admin/teachers'); renderTeachers(refreshed.teachers); } catch (exception) { message.textContent = exception.message; message.style.color = 'var(--danger)'; } });
  } catch (exception) { document.querySelector('#teacher-list').innerHTML = `<tr><td colspan="5" class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</td></tr>`; }
}

async function hydrateClasses() {
  if (window.location.protocol === 'file:') return;
  try {
    const [classes, years, masters] = await Promise.all([apiRequest('/api/classes'), apiRequest('/api/academic-years'), apiRequest('/api/admin/class-masters')]);
    document.querySelector('#new-class-year').innerHTML = years.academic_years.map(item => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('');
    document.querySelector('#new-class-master').innerHTML = '<option value="">No class master assigned</option>' + masters.class_masters.map(item => `<option value="${item.id}">${escapeHtml(item.full_name)} · ${escapeHtml(item.role === 'class_master' ? 'Class master' : 'Teacher')}</option>`).join('');
    
    state.editingClassId = null;
    const resetForm = () => {
      state.editingClassId = null;
      document.querySelector('#new-class-name').value = '';
      document.querySelector('#save-class').textContent = 'Create class';
      document.querySelector('#cancel-edit-class').style.display = 'none';
      document.querySelector('#class-form-title').textContent = 'Create class';
    };

    document.querySelector('#cancel-edit-class').addEventListener('click', resetForm);

    const renderClasses = rows => {
      document.querySelector('#class-list').innerHTML = rows.map(item => `
        <tr data-class-id="${item.id}" data-name="${escapeHtml(item.name)}" data-master-id="${item.class_master_id || ''}" data-year-id="${item.academic_year_id}">
          <td class="student-name">${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.academic_year || 'Current year')}</td>
          <td>${escapeHtml(item.class_master_name || 'Unassigned')}</td>
          <td><span class="status">Active</span></td>
          <td>
            <button class="outline-btn download-classlist-btn" data-class-id="${item.id}" data-class-year-id="${item.academic_year_id || ''}">Download list</button>
            <button class="outline-btn edit-class-btn" data-class-id="${item.id}">Edit</button>
            <button class="outline-btn delete-class-btn" data-class-id="${item.id}">Delete</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="5" class="empty">No classes created yet.</td></tr>';

      document.querySelectorAll('.download-classlist-btn').forEach(btn => btn.addEventListener('click', async () => {
        const classId = btn.dataset.classId;
        const yearId = btn.dataset.classYearId;
        const exportUrl = yearId ? `${API_BASE}/api/admin/classes/${classId}/classlist?academic_year_id=${yearId}` : `${API_BASE}/api/admin/classes/${classId}/classlist`;
        try {
          const response = await fetch(exportUrl, { credentials: 'include' });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Unable to download class list.');
          }
          const blob = await response.blob();
          const link = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          link.href = objectUrl;
          link.download = `class-list-${classId}.xls`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(objectUrl);
        } catch (error) {
          alert(error.message);
        }
      }));

      document.querySelectorAll('.edit-class-btn').forEach(btn => btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        state.editingClassId = Number(btn.dataset.classId);
        document.querySelector('#new-class-name').value = row.dataset.name;
        document.querySelector('#new-class-year').value = row.dataset.yearId;
        document.querySelector('#new-class-master').value = row.dataset.masterId;
        document.querySelector('#save-class').textContent = 'Update class';
        document.querySelector('#cancel-edit-class').style.display = 'inline-block';
        document.querySelector('#class-form-title').textContent = 'Edit class';
      }));

      document.querySelectorAll('.delete-class-btn').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('Deactivate this class? Associated active teacher assignments will also be removed.')) return;
        const message = document.querySelector('#class-form-message');
        try {
          await apiRequest(`/api/admin/classes/${btn.dataset.classId}`, { method: 'DELETE' });
          message.textContent = 'Class deactivated successfully.';
          message.style.color = 'var(--positive)';
          const refreshed = await apiRequest('/api/classes');
          renderClasses(refreshed.classes);
        } catch (err) {
          message.textContent = err.message;
          message.style.color = 'var(--danger)';
        }
      }));
    };

    renderClasses(classes.classes);

    document.querySelector('#save-class').addEventListener('click', async () => {
      const message = document.querySelector('#class-form-message');
      const payload = {
        name: document.querySelector('#new-class-name').value,
        academic_year_id: Number(document.querySelector('#new-class-year').value),
        class_master_id: document.querySelector('#new-class-master').value ? Number(document.querySelector('#new-class-master').value) : null
      };
      try {
        if (state.editingClassId) {
          await apiRequest(`/api/admin/classes/${state.editingClassId}`, { method: 'PUT', body: JSON.stringify(payload) });
          message.textContent = 'Class and class master updated successfully.';
        } else {
          await apiRequest('/api/admin/classes', { method: 'POST', body: JSON.stringify(payload) });
          message.textContent = 'Class created successfully.';
        }
        message.style.color = 'var(--positive)';
        resetForm();
        const refreshed = await apiRequest('/api/classes');
        renderClasses(refreshed.classes);
      } catch (exception) {
        message.textContent = exception.message;
        message.style.color = 'var(--danger)';
      }
    });
  } catch (exception) {
    document.querySelector('#class-list').innerHTML = `<tr><td colspan="5" class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</td></tr>`;
  }
}

async function hydrateAssignments() {
  if (window.location.protocol === 'file:') {
    document.querySelector('#assignment-message').textContent = 'Open http://localhost/mabanda/ to manage live assignments.';
    document.querySelector('#assignment-message').style.color = 'var(--warning)';
    return;
  }
  try {
    const [teachers, subjects, classes, assignments] = await Promise.all([apiRequest('/api/admin/teachers'), apiRequest('/api/subjects'), apiRequest('/api/classes'), apiRequest('/api/admin/assignments')]);
    document.querySelector('#assignment-teacher').innerHTML = teachers.teachers.map(item => `<option value="${item.id}">${escapeHtml(item.full_name)} · ${escapeHtml(item.email)}</option>`).join('');
    document.querySelector('#assignment-subject').innerHTML = subjects.subjects.map(item => `<option value="${item.id}">${escapeHtml(item.name)} (${escapeHtml(item.code)})</option>`).join('');
    document.querySelector('#assignment-class-list').innerHTML = classes.classes.map(item => `<label class="selection-option"><input type="checkbox" name="assignment-class" value="${item.id}"><span>${escapeHtml(item.name)}</span></label>`).join('');
    const allClasses = document.querySelector('#assignment-all-classes');
    allClasses.addEventListener('change', () => { document.querySelectorAll('input[name="assignment-class"]').forEach(input => { input.checked = allClasses.checked || input.checked; input.disabled = allClasses.checked; }); });
    const renderAssignments = rows => {
      document.querySelector('#assignment-list').innerHTML = rows.map(item => `
        <tr data-id="${item.id}" data-teacher-id="${item.teacher_id}" data-subject-id="${item.subject_id}" data-class-id="${item.class_id}">
          <td class="student-name">${escapeHtml(item.teacher_name)}</td>
          <td>${escapeHtml(item.subject_name)} <span style="color:var(--muted)">(${escapeHtml(item.subject_code)})</span></td>
          <td>${escapeHtml(item.class_name)}</td>
          <td>${escapeHtml(item.academic_year)}</td>
          <td><span class="status">Active</span></td>
          <td>
            <button class="outline-btn edit-assignment-btn" data-assignment-id="${item.id}">Edit</button>
            <button class="outline-btn delete-assignment-btn" data-assignment-id="${item.id}">Remove</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" class="empty">No assignments created yet.</td></tr>';

      document.querySelectorAll('.edit-assignment-btn').forEach(button => button.addEventListener('click', () => {
        const row = button.closest('tr');
        state.editingAssignmentId = Number(button.dataset.assignmentId);
        document.querySelector('#assignment-teacher').value = row.dataset.teacherId;
        const subjectSelect = document.querySelector('#assignment-subject');
        [...subjectSelect.options].forEach(opt => opt.selected = Number(opt.value) === Number(row.dataset.subjectId));
        allClasses.checked = false;
        document.querySelectorAll('input[name="assignment-class"]').forEach(input => {
          input.disabled = false;
          input.checked = Number(input.value) === Number(row.dataset.classId);
        });
        document.querySelector('#save-assignment').textContent = 'Update assignment';
        document.querySelector('#cancel-edit-assignment').style.display = 'inline-block';
        document.querySelector('#assignment-form-title').textContent = 'Edit assignment';
      }));

      document.querySelectorAll('.delete-assignment-btn').forEach(button => button.addEventListener('click', async () => {
        if (!confirm('Deactivate this teacher assignment?')) return;
        const message = document.querySelector('#assignment-message');
        try {
          await apiRequest(`/api/admin/assignments/${button.dataset.assignmentId}`, { method: 'DELETE' });
          message.textContent = 'Teacher assignment removed successfully.';
          message.style.color = 'var(--positive)';
          const refreshed = await apiRequest('/api/admin/assignments');
          renderAssignments(refreshed.assignments);
        } catch (exception) {
          message.textContent = exception.message;
          message.style.color = 'var(--danger)';
        }
      }));
    };
    state.editingAssignmentId = null;
    const resetAssignmentForm = () => {
      state.editingAssignmentId = null;
      document.querySelector('#save-assignment').textContent = 'Assign teacher';
      document.querySelector('#cancel-edit-assignment').style.display = 'none';
      document.querySelector('#assignment-form-title').textContent = 'Create assignment';
      allClasses.checked = false;
      document.querySelectorAll('input[name="assignment-class"]').forEach(input => { input.checked = false; input.disabled = false; });
    };

    document.querySelector('#cancel-edit-assignment').addEventListener('click', resetAssignmentForm);

    renderAssignments(assignments.assignments);
    document.querySelector('#save-assignment').addEventListener('click', async () => {
      const button = document.querySelector('#save-assignment');
      const message = document.querySelector('#assignment-message');
      button.disabled = true;
      try {
        const selectedClasses = [...document.querySelectorAll('input[name="assignment-class"]:checked')].map(input => Number(input.value));
        const subjectSelect = document.querySelector('#assignment-subject');
        if (state.editingAssignmentId) {
          await apiRequest(`/api/admin/assignments/${state.editingAssignmentId}`, {
            method: 'PUT',
            body: JSON.stringify({
              teacher_id: Number(document.querySelector('#assignment-teacher').value),
              subject_id: Number(subjectSelect.value),
              class_id: selectedClasses[0] || 0
            })
          });
          message.textContent = 'Assignment updated successfully.';
          resetAssignmentForm();
        } else {
          await apiRequest('/api/admin/assignments', {
            method: 'POST',
            body: JSON.stringify({
              teacher_id: Number(document.querySelector('#assignment-teacher').value),
              subject_ids: [...subjectSelect.selectedOptions].map(option => Number(option.value)),
              all_classes: allClasses.checked,
              class_ids: selectedClasses
            })
          });
          message.textContent = 'Teacher assigned successfully. The assignment is now visible on the teacher dashboard.';
        }
        message.style.color = 'var(--positive)';
        const refreshed = await apiRequest('/api/admin/assignments');
        renderAssignments(refreshed.assignments);
      } catch (exception) {
        message.textContent = exception.message;
        message.style.color = 'var(--danger)';
      }
      button.disabled = false;
    });
  } catch (exception) {
    document.querySelector('#assignment-list').innerHTML = `<tr><td colspan="5" class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</td></tr>`;
  }
}

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

async function apiRequest(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (state.csrf) headers['X-CSRF-Token'] = state.csrf;
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed (${response.status})`);
  }
  return response.headers.get('content-type')?.includes('application/json') ? response.json() : response.blob();
}

function renderLogin() {
  const registering = state.registering === true;
  app.innerHTML = `<div class="login"><section class="login-card"><div class="login-brand"><div class="brand-mark">M</div><h1 class="login-title">${registering ? 'Create teacher account' : 'Welcome back'}</h1><p class="login-copy">${registering ? 'Register your Mabanda teaching account' : 'Sign in to your academic workspace'}</p></div>${registering ? '<label class="field-label" for="full-name">Full name</label><input class="field" id="full-name" placeholder="e.g. Mrs. Sarah Mbida" type="text">' : ''}<label class="field-label" for="email">Email address</label><input class="field" id="email" value="${registering ? '' : 'admin@mabanda.edu'}" type="email"><label class="field-label" for="password">Password</label><input class="field" id="password" value="${registering ? '' : 'password'}" type="password">${registering ? '<label class="field-label" for="confirm-password">Confirm password</label><input class="field" id="confirm-password" type="password">' : '<div class="login-row"><label class="check"><input type="checkbox" checked> Remember me</label><button class="text-link">Forgot password?</button></div>'}<button class="primary-btn login-submit" id="${registering ? 'register-button' : 'login-button'}">${registering ? 'Create teacher account' : 'Sign in to Mabanda'}</button><p class="login-foot" id="login-error">${registering ? 'Teacher accounts can be assigned subjects and classes by an administrator.' : 'Need an account?'} <button class="text-link" id="toggle-auth">${registering ? 'Back to sign in' : 'Register as a teacher'}</button></p></section></div>`;
  normalizeSchoolDisplay();
  document.querySelector('#toggle-auth').addEventListener('click', () => { state.registering = !registering; render(); });
  document.querySelector(`#${registering ? 'register-button' : 'login-button'}`).addEventListener('click', async () => {
    const button = document.querySelector(`#${registering ? 'register-button' : 'login-button'}`);
    const error = document.querySelector('#login-error');
    button.disabled = true;
    button.textContent = registering ? 'Creating account...' : 'Signing in...';
    try {
      if (registering) {
        if (window.location.protocol === 'file:') throw new Error('Teacher registration requires the XAMPP API. Open this app through http://localhost/mabanda/.');
        const password = document.querySelector('#password').value;
        if (password !== document.querySelector('#confirm-password').value) throw new Error('Passwords do not match.');
        await apiRequest('/api/register/teacher', { method: 'POST', body: JSON.stringify({ full_name: document.querySelector('#full-name').value, email: document.querySelector('#email').value, password }) });
        state.registering = false;
        render();
        document.querySelector('#login-error').textContent = 'Account created. Sign in with your new teacher credentials.';
        document.querySelector('#login-error').style.color = 'var(--positive)';
      } else {
        if (window.location.protocol === 'file:') state.loggedIn = true;
        else {
          const result = await apiRequest('/api/login', { method: 'POST', body: JSON.stringify({ email: document.querySelector('#email').value, password: document.querySelector('#password').value }) });
          state.user = result.user; state.csrf = result.csrf; state.loggedIn = true;
        }
        render();
      }
    } catch (exception) {
      error.textContent = exception.message;
      error.style.color = 'var(--danger)';
      button.disabled = false;
      button.textContent = registering ? 'Create teacher account' : 'Sign in to Mabanda';
    }
  });
}

function resultEntry() {
  const previewRows = window.location.protocol === 'file:' ? students.map(student => `<tr><td class="student-name">${student[1]}</td><td>${student[0]}</td><td><input class="field entry-mark" value="${student[4].split(' ')[0]}" placeholder="—"></td><td>${student[5]}</td></tr>`).join('') : '<tr><td colspan="4" class="empty">Choose a class to load students.</td></tr>';
  const reopenButton = state.user?.role === 'administrator' ? '<button class="outline-btn" id="reopen-results">Reopen sequence</button>' : '';
  return `<div class="view">${header('Teacher workspace', 'Result entry', 'Enter, review and submit marks for your assigned classes.', '<button class="outline-btn" data-view="reports">View report cards</button>')}<div class="notice" id="result-notice">Loading your assigned classes and subjects...</div><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Result entry</h2><p class="panel-note">Only subjects assigned to your account are available.</p></div><span class="status pending">Draft</span></div><div class="panel-body"><div class="form-grid"><select class="select" id="result-class"><option>Form 3A</option></select><select class="select" id="result-subject"><option>Mathematics</option></select><select class="select" id="result-term"><option>Loading terms...</option></select><select class="select" id="result-sequence"><option>Loading sequences...</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Matricule number</th><th>Mark</th><th>Evaluation</th></tr></thead><tbody id="result-students">${previewRows}</tbody></table></div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px">${reopenButton}<button class="outline-btn" id="save-results">Save draft</button><button class="primary-btn" id="submit-results">Submit results</button></div></div></article></div>`;
}

async function hydrateResultEntry() {
  if (window.location.protocol === 'file:') return;
  const notice = document.querySelector('#result-notice');
  const setControlsEnabled = enabled => {
    document.querySelector('#save-results').disabled = !enabled;
    document.querySelector('#submit-results').disabled = !enabled;
  };
  try {
    const [classes, subjects, years] = await Promise.all([apiRequest('/api/classes'), apiRequest('/api/subjects'), apiRequest('/api/academic-years')]);
    const classSelect = document.querySelector('#result-class');
    const subjectSelect = document.querySelector('#result-subject');
    const termSelect = document.querySelector('#result-term');
    const sequenceSelect = document.querySelector('#result-sequence');
    const yearId = years.academic_years?.[0]?.id;
    const classRows = Array.isArray(classes.classes) ? classes.classes : [];
    const subjectRows = Array.isArray(subjects.subjects) ? subjects.subjects : [];
    if (!yearId || !classRows.length || !subjectRows.length) throw new Error('No academic year, assigned class, or assigned subject is available for result entry.');
    classSelect.innerHTML = classRows.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
    subjectSelect.innerHTML = subjectRows.map(item => `<option value="${item.id}" data-max="${item.max_mark}">${item.name}</option>`).join('');
    const terms = await apiRequest(`/api/terms?academic_year_id=${yearId}`);
    const termRows = Array.isArray(terms.terms) ? terms.terms : [];
    if (!termRows.length) throw new Error('No terms are configured for the selected academic year. Run the database migration, then refresh.');
    termSelect.innerHTML = termRows.map(item => `<option value="${item.id}">${item.name}</option>`).join('');

    const loadSequences = async () => {
      setControlsEnabled(false);
      const sequences = await apiRequest(`/api/sequences?academic_year_id=${yearId}&term_id=${termSelect.value}`);
      const sequenceRows = Array.isArray(sequences.sequences) ? sequences.sequences : [];
      sequenceSelect.innerHTML = sequenceRows.map(item => `<option value="${item.id}">${item.name}</option>`).join('') || '<option value="">No sequences configured</option>';
      if (!sequenceRows.length) {
        notice.textContent = 'No sequences are configured for this term.';
        notice.style.color = 'var(--warning)';
        return;
      }
      const finalized = await apiRequest(`/api/results/finalized?academic_year_id=${yearId}&term_id=${termSelect.value}&sequence_id=${sequenceSelect.value}`);
      if (finalized.finalized && !Number(finalized.finalized.is_reopened)) {
        notice.textContent = 'This sequence has been finalized by an administrator and is locked for changes.';
        notice.style.color = 'var(--warning)';
        setControlsEnabled(false);
      } else {
        notice.textContent = `${classRows.length} classes available. Choose a subject and start entering marks.`;
        notice.style.color = 'var(--text)';
        setControlsEnabled(true);
        await loadStudents();
      }
    };

    const loadStudents = async () => {
      const data = await apiRequest(`/api/students?class_id=${classSelect.value}&academic_year_id=${yearId}`);
      const results = await apiRequest(`/api/results?class_id=${classSelect.value}&academic_year_id=${yearId}&term_id=${termSelect.value}&sequence_id=${sequenceSelect.value}`);
      const savedMarks = new Map((results.results || []).filter(result => Number(result.subject_id) === Number(subjectSelect.value)).map(result => [Number(result.student_id), result]));
      document.querySelector('#result-students').innerHTML = data.students.map(student => {
        const saved = savedMarks.get(Number(student.id));
        const evaluation = saved ? `${saved.percentage}% · ${saved.evaluation}` : 'Not entered';
        return `<tr data-student-id="${student.id}"><td class="student-name">${student.full_name}</td><td>${student.student_id}</td><td><input class="field entry-mark" value="${saved ? saved.mark : ''}" placeholder="—" inputmode="decimal"></td><td class="evaluation">${evaluation}</td></tr>`;
      }).join('') || '<tr><td colspan="4" class="empty">No students found in this class.</td></tr>';
      notice.textContent = `${data.students.length} students loaded. Marks are validated by the server before saving.`;
    };

    classSelect.addEventListener('change', loadStudents);
    subjectSelect.addEventListener('change', loadStudents);
    termSelect.addEventListener('change', loadSequences);
    sequenceSelect.addEventListener('change', loadStudents);
    await loadSequences();
    document.querySelector('#save-results').addEventListener('click', () => saveResults(false));
    document.querySelector('#submit-results').addEventListener('click', () => saveResults(true));
    document.querySelector('#reopen-results')?.addEventListener('click', async () => {
      const button = document.querySelector('#reopen-results');
      button.disabled = true;
      try {
        await apiRequest('/api/results/reopen', { method: 'POST', body: JSON.stringify({ academic_year_id: Number(yearId), term_id: Number(termSelect.value), sequence_id: Number(sequenceSelect.value) }) });
        notice.textContent = 'Sequence reopened. Teachers can now edit these results.';
        notice.style.color = 'var(--positive)';
        await loadSequences();
      } catch (error) {
        notice.textContent = error.message;
        notice.style.color = 'var(--danger)';
      } finally {
        button.disabled = false;
      }
    });
    async function saveResults(submit) {
      const finalized = await apiRequest(`/api/results/finalized?academic_year_id=${yearId}&term_id=${termSelect.value}&sequence_id=${sequenceSelect.value}`);
      if (finalized.finalized && !Number(finalized.finalized.is_reopened) && state.user.role !== 'administrator') {
        notice.textContent = 'This sequence has been finalized and cannot be edited.';
        notice.style.color = 'var(--danger)';
        return;
      }

      const rows = [...document.querySelectorAll('#result-students tr[data-student-id]')];
      rows.forEach(r => r.style.outline = '');
      const values = rows.map(row => ({ row, markStr: row.querySelector('.entry-mark').value.trim() })).filter(item => item.markStr !== '');
      if (!values.length) {
        notice.textContent = 'No marks entered to save.';
        notice.style.color = 'var(--warning)';
        return;
      }
      let hasError = false;
      for (const item of values) {
        const numericMark = Number(item.markStr);
        if (isNaN(numericMark)) {
          item.row.style.outline = '1px solid var(--danger)';
          notice.textContent = 'Invalid mark entered. Please ensure all marks are valid numbers.';
          notice.style.color = 'var(--danger)';
          return;
        }
        try {
          await apiRequest('/api/results', {
            method: 'POST',
            body: JSON.stringify({
              student_id: Number(item.row.dataset.studentId),
              subject_id: Number(subjectSelect.value),
              class_id: Number(classSelect.value),
              academic_year_id: Number(yearId),
              term_id: Number(termSelect.value),
              sequence_id: Number(sequenceSelect.value),
              mark: numericMark
            })
          });
        } catch (err) {
          item.row.style.outline = '1px solid var(--danger)';
          notice.textContent = `Error saving mark: ${err.message}`;
          notice.style.color = 'var(--danger)';
          hasError = true;
          break;
        }
      }
      if (hasError) return;
      if (submit) {
        try {
          await apiRequest('/api/results/submit', {
            method: 'POST',
            body: JSON.stringify({
              subject_id: Number(subjectSelect.value),
              class_id: Number(classSelect.value),
              academic_year_id: Number(yearId),
              term_id: Number(termSelect.value),
              sequence_id: Number(sequenceSelect.value)
            })
          });
          notice.textContent = 'Results submitted for review.';
          notice.style.color = 'var(--positive)';
        } catch (err) {
          notice.textContent = err.message;
          notice.style.color = 'var(--danger)';
        }
      } else {
        notice.textContent = 'Draft results saved.';
        notice.style.color = 'var(--positive)';
      }
    }
  } catch (exception) {
    notice.textContent = exception.message;
    notice.style.color = 'var(--danger)';
  }
}

function analyticsPage() {
  return `<div class="view">${header('Administrator insights', 'Performance analytics', 'Compare classes, subjects and pass rates for the selected sequence.', '<button class="outline-btn" data-view="dashboard">Back to overview</button>')}<article class="panel"><div class="panel-body"><div class="form-grid"><select class="select" id="analytics-year"><option>Loading years...</option></select><select class="select" id="analytics-term"><option>Choose term...</option></select><select class="select" id="analytics-sequence"><option>Choose sequence...</option></select></div></div></article><section class="grid stats-grid" id="analytics-stats"><article class="panel stat-card"><div class="stat-head"><span>Overall average</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Pass percentage</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Best class</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Students</span></div><div class="stat-value">Loading</div></article></section><section class="grid split-grid"><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Performance by class</h2><p class="panel-note">Weighted class averages</p></div></div><div class="panel-body" id="analytics-classes"><div class="empty">Loading analytics...</div></div></article><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Performance by subject</h2><p class="panel-note">Average percentage</p></div></div><div class="panel-body" id="analytics-subjects"><div class="empty">Loading analytics...</div></div></article></section></div>`;
}

async function hydrateAnalytics() {
  const yearSelect = document.querySelector('#analytics-year');
  const termSelect = document.querySelector('#analytics-term');
  const sequenceSelect = document.querySelector('#analytics-sequence');
  const renderAnalytics = data => {
    document.querySelector('#analytics-stats').innerHTML = [['Overall average', `${data.overall_average}%`], ['Pass percentage', `${data.pass_percentage}%`], ['Best class', data.best_class?.name || '—'], ['Students', data.total_students]].map(item => `<article class="panel stat-card"><div class="stat-head"><span>${item[0]}</span></div><div class="stat-value">${item[1]}</div></article>`).join('');
    document.querySelector('#analytics-classes').innerHTML = data.classes.map(item => `<div style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--line);color:var(--muted-bright)"><span>${escapeHtml(item.name)}</span><strong style="color:var(--blue-bright)">${item.average}%</strong></div>`).join('') || '<div class="empty">No class results found.</div>';
    document.querySelector('#analytics-subjects').innerHTML = data.subjects.map(item => `<div style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--line);color:var(--muted-bright)"><span>${escapeHtml(item.name)}</span><strong style="color:var(--blue-bright)">${item.average}%</strong></div>`).join('') || '<div class="empty">No subject results found.</div>';
  };
  if (window.location.protocol === 'file:') {
    yearSelect.innerHTML = '<option value="1">2026/2027</option>';
    termSelect.innerHTML = '<option value="1">First Term</option>';
    sequenceSelect.innerHTML = '<option value="1">First Sequence</option><option value="2">Second Sequence</option>';
    renderAnalytics({ overall_average: 62.47, pass_percentage: 78.1, best_class: { name: 'Form 4A' }, total_students: 36, classes: [['Form 3A', 62.5], ['Form 3B', 60.8], ['Form 4A', 64.1]].map(item => ({ name: item[0], average: item[1] })), subjects: [['Mathematics', 63.4], ['English Language', 61.8], ['Physics', 62.2], ['Biology', 64.7], ['Computer Science', 60.9], ['Economics', 65.1]].map(item => ({ name: item[0], average: item[1] })) });
    return;
  }
  try {
    const years = await apiRequest('/api/academic-years');
    yearSelect.innerHTML = years.academic_years.map(item => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('');
    const loadTerms = async () => {
      const terms = await apiRequest(`/api/terms?academic_year_id=${yearSelect.value}`);
      termSelect.innerHTML = terms.terms.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
      await loadSequences();
    };
    const loadSequences = async () => {
      const sequences = await apiRequest(`/api/sequences?academic_year_id=${yearSelect.value}&term_id=${termSelect.value}`);
      sequenceSelect.innerHTML = sequences.sequences.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
      await loadAnalytics();
    };
    const loadAnalytics = async () => {
      if (!termSelect.value || !sequenceSelect.value) return;
      const response = await apiRequest(`/api/admin/analytics?academic_year_id=${yearSelect.value}&term_id=${termSelect.value}&sequence_id=${sequenceSelect.value}`);
      renderAnalytics(response.analytics);
    };
    yearSelect.addEventListener('change', loadTerms);
    termSelect.addEventListener('change', loadSequences);
    sequenceSelect.addEventListener('change', loadAnalytics);
    await loadTerms();
  } catch (exception) {
    document.querySelector('#analytics-classes').innerHTML = `<div class="empty" style="color:var(--danger)">${exception.message}</div>`;
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function studentsPage() {
  return `<div class="view">${header('Student records', 'Students', 'Register students, manage class placement, and review performance history.', '<button class="primary-btn" id="register-student">+ Register student</button>')}<article class="panel" id="student-form-panel" style="display:none;margin-bottom:16px"><div class="panel-header"><div><h2 class="panel-title">Register student</h2><p class="panel-note">The student will be enrolled in the selected class and academic year.</p></div></div><div class="panel-body"><div class="form-grid"><input class="field" id="new-student-id" placeholder="Student ID"><input class="field" id="new-registration-number" placeholder="Matricule number"><input class="field" id="new-full-name" placeholder="Full name"><select class="select" id="new-gender"><option value="">Gender</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select><input class="field" id="new-date-of-birth" type="date"><input class="field" id="new-guardian-name" placeholder="Parent/guardian name"><input class="field" id="new-guardian-phone" placeholder="Parent/guardian phone"><select class="select" id="new-class"><option>Loading classes...</option></select><select class="select" id="new-year"><option>Loading years...</option></select></div><button class="primary-btn" id="save-student">Register student</button><button class="outline-btn" id="cancel-student" style="margin-left:8px">Cancel</button><p class="panel-note" id="student-form-message" style="margin-top:12px"></p></div></article><article class="panel"><div class="toolbar" style="padding:20px 22px 0"><input class="search" id="student-search" placeholder="Search students..."><span class="panel-note" id="student-count">Loading records...</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Academic year</th><th>Status</th><th>Actions</th></tr></thead><tbody id="student-directory"><tr><td colspan="6" class="empty">Loading students...</td></tr></tbody></table></div></article><article class="panel" id="student-history-panel" style="margin-top:16px;display:none"></article></div>`;
}

async function hydrateStudents() {
  if (window.location.protocol === 'file:') {
    document.querySelector('#student-directory').innerHTML = students.map(student => `<tr><td class="student-name">${student[1]}</td><td>${student[0]}</td><td>${student[2]}</td><td>2026/2027</td><td><span class="status">Active</span></td><td><button class="outline-btn">Profile</button></td></tr>`).join('');
    document.querySelector('#student-count').textContent = `${students.length} demo records`;
    return;
  }
  try {
    const [response, classes, years] = await Promise.all([apiRequest('/api/admin/students'), apiRequest('/api/classes'), apiRequest('/api/academic-years')]);
    document.querySelector('#new-class').innerHTML = classes.classes.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
    document.querySelector('#new-year').innerHTML = years.academic_years.map(item => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('');
    document.querySelector('#register-student').addEventListener('click', () => { document.querySelector('#student-form-panel').style.display = 'block'; });
    document.querySelector('#cancel-student').addEventListener('click', () => { document.querySelector('#student-form-panel').style.display = 'none'; });
    document.querySelector('#save-student').addEventListener('click', async () => {
      const message = document.querySelector('#student-form-message');
      try {
        await apiRequest('/api/admin/students', { method: 'POST', body: JSON.stringify({ student_id: document.querySelector('#new-student-id').value, registration_number: document.querySelector('#new-registration-number').value, full_name: document.querySelector('#new-full-name').value, gender: document.querySelector('#new-gender').value || null, date_of_birth: document.querySelector('#new-date-of-birth').value || null, guardian_name: document.querySelector('#new-guardian-name').value, guardian_phone: document.querySelector('#new-guardian-phone').value, class_id: Number(document.querySelector('#new-class').value), academic_year_id: Number(document.querySelector('#new-year').value) }) });
        message.textContent = 'Student registered successfully.'; message.style.color = 'var(--positive)'; document.querySelector('#student-form-panel').style.display = 'none'; const refreshed = await apiRequest('/api/admin/students'); renderRows(refreshed.students);
      } catch (exception) { message.textContent = exception.message; message.style.color = 'var(--danger)'; }
    });
    const directory = document.querySelector('#student-directory');
    const renderRows = records => {
      directory.innerHTML = records.map(student => `<tr><td class="student-name">${escapeHtml(student.full_name)}</td><td>${escapeHtml(student.student_id)}</td><td>${escapeHtml(student.class_name || 'Unassigned')}</td><td>${escapeHtml(student.academic_year || '—')}</td><td><span class="status">Active</span></td><td><button class="outline-btn profile-button" data-student-id="${student.id}">Profile</button> <button class="outline-btn deactivate-button" data-student-id="${student.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No students found.</td></tr>';
      document.querySelector('#student-count').textContent = `${records.length} active records`;
      directory.querySelectorAll('.profile-button').forEach(button => button.addEventListener('click', () => loadStudentHistory(button.dataset.studentId)));
      directory.querySelectorAll('.deactivate-button').forEach(button => button.addEventListener('click', async () => { if (!confirm('Deactivate this student? Academic history will be preserved.')) return; await apiRequest(`/api/admin/students/${button.dataset.studentId}`, { method: 'DELETE' }); const refreshed = await apiRequest('/api/admin/students'); renderRows(refreshed.students); }));
    };
    renderRows(response.students);
    document.querySelector('#student-search').addEventListener('input', event => {
      const term = event.target.value.toLowerCase();
      renderRows(response.students.filter(student => `${student.full_name} ${student.student_id} ${student.class_name || ''}`.toLowerCase().includes(term)));
    });
  } catch (exception) {
    document.querySelector('#student-directory').innerHTML = `<tr><td colspan="6" class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</td></tr>`;
  }
}

async function loadStudentHistory(studentId) {
  const panel = document.querySelector('#student-history-panel');
  panel.style.display = 'block';
  panel.innerHTML = '<div class="empty">Loading performance history...</div>';
  try {
    const response = await apiRequest(`/api/admin/students/${studentId}/history`);
    const profile = response.student;
    const history = response.history;
    panel.innerHTML = `<div class="panel-header"><div><h2 class="panel-title">${escapeHtml(profile.full_name)} · Performance history</h2><p class="panel-note">Historical results across sequences and academic years</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Academic year</th><th>Sequence</th><th>Class</th><th>Average</th><th>Grade</th><th>Subjects</th><th>Trend</th></tr></thead><tbody>${history.map(item => `<tr><td>${escapeHtml(item.academic_year)}</td><td>${escapeHtml(item.sequence)}</td><td>${escapeHtml(item.class_name)}</td><td class="student-name">${item.average_percentage}%</td><td>${escapeHtml(item.grade || '—')} · ${escapeHtml(item.evaluation)}</td><td>${item.subjects} <span style="color:var(--positive)">+${item.passed}</span> <span style="color:var(--danger)">-${item.failed}</span></td><td style="color:${item.trend === 'improving' ? 'var(--positive)' : item.trend === 'declining' ? 'var(--danger)' : 'var(--muted)'}">${escapeHtml(item.trend)}${item.delta === null ? '' : ` (${item.delta > 0 ? '+' : ''}${item.delta}%)`}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No results recorded yet.</td></tr>'}</tbody></table></div>`;
  } catch (exception) {
    panel.innerHTML = `<div class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</div>`;
  }
}

function teacherDashboard() {
  return `<div class="view">${header('Teacher workspace', `Welcome, ${state.user?.full_name || 'Teacher'}`, 'Your assigned teaching workload and result progress.', '<button class="primary-btn" data-view="results">+ Enter results</button>')}<section class="grid stats-grid" id="teacher-dashboard-stats"><article class="panel stat-card"><div class="stat-head"><span>Assigned subjects</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Assigned classes</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Awaiting entry</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Completed results</span></div><div class="stat-value">Loading</div></article></section><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Your assignments</h2><p class="panel-note">Only these subject and class combinations can be edited.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Subject</th><th>Class</th><th>Action</th></tr></thead><tbody id="teacher-assignments"><tr><td colspan="3" class="empty">Loading assignments...</td></tr></tbody></table></div></article></div>`;
}

function classMasterDashboard() {
  return `<div class="view">${header('Class master workspace', `Welcome, ${state.user?.full_name || 'Class master'}`, 'Monitor your assigned class and prepare report cards.', '<button class="primary-btn" data-view="reports">Generate report cards</button>')}<section class="grid stats-grid" id="master-dashboard-stats"><article class="panel stat-card"><div class="stat-head"><span>Assigned classes</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Students</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Class average</span></div><div class="stat-value">Loading</div></article><article class="panel stat-card"><div class="stat-head"><span>Ranked students</span></div><div class="stat-value">Loading</div></article></section><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Class performance overview</h2><p class="panel-note">Assigned classes for the current academic sequence</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Class</th><th>Students</th><th>Average</th><th>Passed</th><th>Action</th></tr></thead><tbody id="master-classes"><tr><td colspan="5" class="empty">Loading class performance...</td></tr></tbody></table></div></article></div>`;
}

async function hydrateRoleDashboard() {
  if (window.location.protocol === 'file:') return;
  try {
    const data = (await apiRequest('/api/dashboard')).dashboard;
    if (data.role === 'teacher') {
      document.querySelector('#teacher-dashboard-stats').innerHTML = [['Assigned subjects', data.assigned_subjects], ['Assigned classes', data.assigned_classes], ['Awaiting entry', data.pending_results], ['Completed results', data.completed_results]].map(item => `<article class="panel stat-card"><div class="stat-head"><span>${item[0]}</span></div><div class="stat-value">${item[1]}</div></article>`).join('');
      document.querySelector('#teacher-assignments').innerHTML = data.assignments.map(item => `<tr><td class="student-name">${item.subject_name}</td><td>${item.class_name}</td><td><button class="outline-btn" data-view="results">Enter marks</button></td></tr>`).join('') || '<tr><td colspan="3" class="empty">No assignments yet. Ask an administrator to assign subjects and classes.</td></tr>';
      document.querySelectorAll('#teacher-assignments [data-view]').forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; render(); }));
    } else if (data.role === 'class_master') {
      const classes = data.classes || [];
      const average = classes.length ? (classes.reduce((sum, item) => sum + Number(item.performance.class_average), 0) / classes.length).toFixed(2) : '0.00';
      const ranked = classes.reduce((sum, item) => sum + Number(item.performance.student_count), 0);
      document.querySelector('#master-dashboard-stats').innerHTML = [['Assigned classes', classes.length], ['Students', data.students], ['Class average', `${average}%`], ['Ranked students', ranked]].map(item => `<article class="panel stat-card"><div class="stat-head"><span>${item[0]}</span></div><div class="stat-value">${item[1]}</div></article>`).join('');
      document.querySelector('#master-classes').innerHTML = classes.map(item => `<tr><td class="student-name">${item.name}</td><td>${item.students}</td><td>${item.performance.class_average}%</td><td>${item.performance.total_passed}</td><td><button class="outline-btn" data-view="reports">Report cards</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No classes assigned.</td></tr>';
      document.querySelectorAll('#master-classes [data-view]').forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; render(); }));
    }
  } catch (exception) {
    const target = document.querySelector('#teacher-dashboard-stats') || document.querySelector('#master-dashboard-stats');
    if (target) target.innerHTML = `<article class="panel"><div class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</div></article>`;
  }
}

function settingsPage() {
  return `<div class="view">${header('Administration', 'Submitted reports', 'Review marks submitted by each teacher, class and subject.', '<button class="outline-btn" data-view="reports">Report cards</button>')}<article class="panel"><div class="panel-body"><div class="form-grid"><select class="select" id="submitted-year"><option>Loading years...</option></select><select class="select" id="submitted-term"><option>Choose term...</option></select><select class="select" id="submitted-sequence"><option>Choose sequence...</option></select><select class="select" id="submitted-teacher"><option value="">All teachers</option></select><select class="select" id="submitted-class"><option value="">All classes</option></select><select class="select" id="submitted-subject"><option value="">All subjects</option></select><div style="display:flex;gap:8px;align-items:center"><input class="field" id="submitted-search" placeholder="Search student name or ID"><button class="primary-btn" id="submitted-search-btn" type="button">Search</button></div></div></div></article><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Submitted marks</h2><p class="panel-note" id="submitted-summary">Choose a reporting period to load submitted reports.</p></div><button class="outline-btn" id="refresh-submitted-reports">Refresh</button></div><div id="submitted-reports" class="table-wrap"><div class="empty">Loading submitted reports...</div></div></article></div>`;
}

async function hydrateSettings() {
  const container = document.querySelector('#submitted-reports');
  if (!container) return;
  const yearSelect = document.querySelector('#submitted-year');
  const termSelect = document.querySelector('#submitted-term');
  const sequenceSelect = document.querySelector('#submitted-sequence');
  const teacherSelect = document.querySelector('#submitted-teacher');
  const classSelect = document.querySelector('#submitted-class');
  const subjectSelect = document.querySelector('#submitted-subject');
  const searchInput = document.querySelector('#submitted-search');
  const searchButton = document.querySelector('#submitted-search-btn');
  const summary = document.querySelector('#submitted-summary');

  if (window.location.protocol === 'file:') {
    document.querySelector('#submitted-year').innerHTML = '<option value="1">2026/2027</option>';
    document.querySelector('#submitted-term').innerHTML = '<option value="1">First Term</option>';
    document.querySelector('#submitted-sequence').innerHTML = '<option value="1">First Sequence</option>';
    const demoReports = students.map((student, index) => ({
      teacher_name: 'Mr. John',
      student_name: student[1],
      class_name: student[2],
      subject_name: student[3],
      mark: student[4].split(' ')[0],
      max_mark: student[4].split(' ')[2],
      percentage: Math.round(Number(student[4].split(' ')[0]) / Number(student[4].split(' ')[2]) * 100),
      status: 'submitted',
      updated_at: `${index + 1} hour${index === 0 ? '' : 's'} ago`
    }));
    const renderDemoReports = () => {
      const search = searchInput.value.trim().toLowerCase();
      const matches = demoReports.filter(item => !search || item.student_name.toLowerCase().includes(search));
      container.innerHTML = `<table class="data-table"><thead><tr><th>Teacher</th><th>Student</th><th>Class</th><th>Subject</th><th>Mark</th><th>Percentage</th><th>Status</th><th>Submitted</th></tr></thead><tbody>${matches.map(item => `<tr><td>${escapeHtml(item.teacher_name)}</td><td class="student-name">${escapeHtml(item.student_name)}</td><td>${escapeHtml(item.class_name)}</td><td>${escapeHtml(item.subject_name)}</td><td>${item.mark}/${item.max_mark}</td><td class="student-name">${item.percentage}%</td><td><span class="status approved">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.updated_at)}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">No submitted reports found for that student.</td></tr>'}</tbody></table>`;
      summary.textContent = `${matches.length} submitted report${matches.length === 1 ? '' : 's'} found.`;
    };
    searchButton.addEventListener('click', renderDemoReports);
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        renderDemoReports();
      }
    });
    document.querySelector('#refresh-submitted-reports').addEventListener('click', () => {
      searchInput.value = '';
      renderDemoReports();
    });
    renderDemoReports();
    return;
  }
  try {
    const [years, classes, teachers, subjects] = await Promise.all([apiRequest('/api/academic-years'), apiRequest('/api/classes'), apiRequest('/api/admin/teachers'), apiRequest('/api/subjects')]);
    yearSelect.innerHTML = years.academic_years.map(item => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('');
    classSelect.innerHTML = '<option value="">All classes</option>' + classes.classes.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
    teacherSelect.innerHTML = '<option value="">All teachers</option>' + teachers.teachers.map(item => `<option value="${item.id}">${escapeHtml(item.full_name)}</option>`).join('');
    subjectSelect.innerHTML = '<option value="">All subjects</option>' + subjects.subjects.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
    const loadTerms = async () => {
      const terms = await apiRequest(`/api/terms?academic_year_id=${yearSelect.value}`);
      termSelect.innerHTML = terms.terms.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('') || '<option value="">No terms found</option>';
      await loadSequences();
    };
    const loadSequences = async () => {
      const sequences = await apiRequest(`/api/sequences?academic_year_id=${yearSelect.value}&term_id=${termSelect.value}`);
      sequenceSelect.innerHTML = sequences.sequences.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('') || '<option value="">No sequences found</option>';
      await loadSubmitted();
    };
    const loadSubmitted = async () => {
      if (!termSelect.value || !sequenceSelect.value) return;
      const searchValue = (searchInput.value || '').trim();
      const params = new URLSearchParams({ academic_year_id: yearSelect.value, term_id: termSelect.value, sequence_id: sequenceSelect.value, teacher_id: teacherSelect.value, class_id: classSelect.value, subject_id: subjectSelect.value, search: searchValue });
      const response = await apiRequest(`/api/admin/submitted-reports?${params}`);
      const normalizedSearch = searchValue.toLowerCase();
      const reports = response.reports.filter(item => !normalizedSearch || `${item.student_name} ${item.student_number || ''}`.toLowerCase().includes(normalizedSearch));
      container.innerHTML = `<table class="data-table"><thead><tr><th>Teacher</th><th>Student</th><th>Class</th><th>Subject</th><th>Mark</th><th>Percentage</th><th>Status</th><th>Submitted</th></tr></thead><tbody>${reports.map(item => `<tr><td>${escapeHtml(item.teacher_name)}</td><td class="student-name">${escapeHtml(item.student_name)}</td><td>${escapeHtml(item.class_name)}</td><td>${escapeHtml(item.subject_name)}</td><td>${item.mark}/${item.max_mark}</td><td class="student-name">${item.percentage}%</td><td><span class="status approved">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.updated_at)}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">No submitted reports found for that student.</td></tr>'}</tbody></table>`;
      summary.textContent = `${reports.length} submitted report${reports.length === 1 ? '' : 's'} found.`;
    };
    yearSelect.addEventListener('change', loadTerms);
    termSelect.addEventListener('change', loadSequences);
    sequenceSelect.addEventListener('change', loadSubmitted);
    teacherSelect.addEventListener('change', loadSubmitted);
    classSelect.addEventListener('change', loadSubmitted);
    subjectSelect.addEventListener('change', loadSubmitted);
    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim() === '') loadSubmitted();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadSubmitted();
      }
    });
    searchButton.addEventListener('click', loadSubmitted);
    document.querySelector('#refresh-submitted-reports').addEventListener('click', () => {
      searchInput.value = '';
      loadSubmitted();
    });
    await loadTerms();
  } catch (exception) { container.innerHTML = `<div class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</div>`; }
}

// Attach refresh button listener after render
function attachSettingsListeners() {
  return;
}

function render() {
  if (!app) return;

  if (!state.loggedIn) {
    renderLogin();
    return;
  }

  const pageMap = {
    dashboard: () => {
      if (state.user?.role === 'teacher') return teacherDashboard();
      if (state.user?.role === 'class_master') return classMasterDashboard();
      return dashboard();
    },
    results: resultEntry,
    students: studentsPage,
    teachers: teachersPage,
    classes: classesPage,
    subjects: subjectsPage,
    reports: reportsPage,
    analytics: analyticsPage,
    assignments: assignmentsPage,
    settings: settingsPage
  };

  const viewRenderer = pageMap[state.view] || pageMap.dashboard;
  const content = viewRenderer();
  app.innerHTML = layout(content);

  app.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      const nextView = button.dataset.view;
      if (!nextView) return;
      state.view = nextView;
      render();
    });
  });

  switch (state.view) {
    case 'dashboard':
      hydrateRoleDashboard();
      break;
    case 'results':
      hydrateResultEntry();
      break;
    case 'students':
      hydrateStudents();
      break;
    case 'teachers':
      hydrateTeachers();
      break;
    case 'classes':
      hydrateClasses();
      break;
    case 'subjects':
      break;
    case 'analytics':
      hydrateAnalytics();
      break;
    case 'reports':
      hydrateReports();
      break;
    case 'assignments':
      hydrateAssignments();
      break;
    case 'settings':
      hydrateSettings();
      attachSettingsListeners();
      break;
    default:
      break;
  }
}

render();
