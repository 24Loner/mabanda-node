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
    ['dashboard', '\u2302', 'Overview'],
    ['results', '\u25C8', 'Result entry'],
    ['students', '\u25C7', 'Students'],
    ['teachers', '\u2661', 'Teachers'],
    ['classes', '\u25A6', 'Classes'],
    ['subjects', '\u270E', 'Subjects'],
    ['reports', '\u25A4', 'Report cards'],
    ['analytics', '\u25D2', 'Analytics'],
    ['assignments', '\u21C4', 'Assignments'],
    ['administrators', '\u2665', 'Administrators'],
    ['settings', '✓', 'Submitted reports']
  ];

  const user = state.user || {
    full_name: 'Admin Nfor',
    role: 'administrator'
  };

  const initials = user.full_name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const visibleNav =
    (user.role === 'administrator' || user.role === 'admin')
      ? nav
      : user.role === 'teacher'
        ? [
            ['dashboard', '\u2302', 'Dashboard'],
            ['results', '\u25C8', 'Enter Results'],
            ['teacher-classes', '\u25A6', 'My Classes'],
            ['teacher-subjects', '\u270E', 'My Subjects'],
            ['teacher-profile', '\u2661', 'My Profile']
          ]
        : nav.filter(([id]) => !['assignments', 'classes', 'teachers'].includes(id));

  return `
    <div class="shell">

      <aside class="sidebar" id="main-sidebar">

        <div class="brand">
          <div class="brand-mark">
            <img src="/assets/school-logo.jpeg" alt="Atlantic Bilingual College Mabanda">
          </div>

          <div class="brand-name">
            ATLANTIC BILINGUAL COLLEGE MABANDA
            <small>Academic OS</small>
          </div>

          <button
            class="mobile-menu-toggle"
            id="mobile-menu-toggle"
            type="button"
            aria-label="Open navigation menu"
            aria-expanded="false"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div class="mobile-menu-panel">

          <div class="nav-label">Workspace</div>

          <nav class="nav-list">
            ${visibleNav.map(([id, glyph, label]) => `
              <button
                class="nav-item ${state.view === id ? 'active' : ''}"
                data-view="${id}"
              >
                ${icon(glyph)}
                <span>${label}</span>
              </button>
            `).join('')}
          </nav>

          <div class="sidebar-footer">

            <div class="profile-mini">
              <div class="avatar">${initials}</div>
              <div>
                <strong style="color:var(--text);display:block;font-size:12px">
                  ${user.full_name}
                </strong>
                <span>${user.role.replace('_', ' ')}</span>
              </div>
            </div>

            <button class="nav-item logout-btn" id="logout-button" type="button">
              ${icon('\u21AA')}<span>Logout</span>
            </button>

          </div>

        </div>

      </aside>

      <main class="main">${content}</main>

    </div>
  `;
}


function header(kicker, title, copy, action = '') { return `<header class="topbar"><div><p class="eyebrow">${kicker}</p><h1 class="page-title">${title}</h1><p class="page-subtitle">${copy}</p></div><div class="top-actions"><button class="icon-btn" title="Notifications" aria-label="Notifications">♢</button>${action}</div></header>`; }
function stat(label, value, trend, glyph) { return `<article class="panel stat-card"><div class="stat-head"><span>${label}</span><span class="stat-glyph">${glyph}</span></div><div class="stat-value">${value}</div><div class="stat-trend">${trend}</div></article>`; }
function dashboard() {
  return `<div class="view">${header('Wednesday, 16 September 2026', 'Good morning, Admin', 'Here is the academic pulse across Atlantic Bilingual College Mabanda.', '<button class="primary-btn" data-view="results">+ Enter results</button>')}<section class="grid stats-grid">
    ${stat('Total students', '<span id="admin-total-students">—</span>', 'Active students', 'Live')}
    ${stat('School average', '<span id="admin-school-average">—</span>', 'Current sequence', 'Live')}
    ${stat('Results recorded', '<span id="admin-results-recorded">—</span>', 'Current sequence', 'Live')}
    ${stat('Active teachers', '<span id="admin-active-teachers">—</span>', 'Active accounts', 'Live')}
  </section>
  <section class="grid split-grid">
    <article class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Performance overview</h2>
          <p class="panel-note">Average score by class · Current sequence</p>
        </div>
        <button class="outline-btn">This sequence</button>
      </div>
      <div class="panel-body">
        <div class="chart" id="admin-performance-chart">
          <div class="empty">Loading performance data...</div>
        </div>
        <div class="legend">
          <span><i class="dot"></i>Class average</span>
          <span><i class="dot violet"></i>Target: 70%</span>
        </div>
      </div>
    </article>
    <article class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Recent activity</h2>
          <p class="panel-note">Live dashboard data</p>
        </div>
      </div>
      <div class="panel-body activity-list">
        <div class="activity">
          <div class="activity-icon">•</div>
          <div class="activity-text">
            <b style="color:var(--text)">Dashboard data loaded</b>
            <span class="activity-time">Current academic sequence</span>
          </div>
        </div>
        <div class="activity">
          <div class="activity-icon">•</div>
          <div class="activity-text">
            <b style="color:var(--text)">Student records are live</b>
            <span class="activity-time">Counts update from active records</span>
          </div>
        </div>
        <div class="activity">
          <div class="activity-icon">+</div>
          <div class="activity-text">
            <b style="color:var(--text)">Results are calculated from the database</b>
            <span class="activity-time">Current sequence</span>
          </div>
        </div>
      </div>
    </article>
  </section>
  <section class="panel" style="margin-top:16px">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">Class performance</h2>
        <p class="panel-note">Live class averages and active student counts</p>
      </div>
      <button class="outline-btn" data-view="analytics">View analytics</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Class master</th>
            <th>Students</th>
            <th>Average</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="admin-class-performance">
          <tr><td colspan="5" class="empty">Loading class performance...</td></tr>
        </tbody>
      </table>
    </div>
  </section>
  </div>`;
}
function genericPage(title, copy, label) { return `<div class="view">${header(label, title, copy, '<button class="primary-btn" data-toast="Action queued">+ Add new</button>')}<article class="panel"><div class="toolbar" style="padding:20px 22px 0"><input class="search" placeholder="Search records..."><button class="outline-btn">Filter</button></div><div class="empty">This workspace is ready for your ${title.toLowerCase()} data.<br><span style="font-size:12px;color:#61718a">Connect the secure application API here without changing the visual system.</span></div></article></div>`; }
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
     list.querySelectorAll('.report-download').forEach(button =>
  button.addEventListener('click', async () => {
    const originalText = button.textContent;

    // Open the mobile PDF window immediately while this is still
    // a direct user interaction. This prevents popup blockers
    // from blocking the PDF window after the async request.
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    );

    let pdfWindow = null;

    if (isMobile) {
      pdfWindow = window.open('', '_blank');

      if (!pdfWindow) {
        alert(
          'Your browser blocked the PDF window. Please allow pop-ups for this site and try again.'
        );
        return;
      }

      pdfWindow.document.title = 'Preparing report card...';
      pdfWindow.document.body.innerHTML = `
        <div style="
          font-family:system-ui,sans-serif;
          display:flex;
          align-items:center;
          justify-content:center;
          min-height:100vh;
          text-align:center;
          padding:24px;
          box-sizing:border-box;
        ">
          <div>
            <h2>Preparing report card...</h2>
            <p>Please wait while the PDF is generated.</p>
          </div>
        </div>
      `;
    }

    try {
      button.disabled = true;
      button.textContent = 'Preparing PDF...';

      const blob = await apiRequest('/api/report-cards', {
        method: 'POST',
        body: JSON.stringify({
          student_id: Number(button.dataset.student),
          class_id: Number(button.dataset.class),
          academic_year_id: Number(yearSelect.value),
          term_id: Number(termSelect.value),
          sequence_id: Number(sequenceSelect.value)
        })
      });

      const objectUrl = URL.createObjectURL(blob);
      const filename = `report-card-${button.dataset.student}.pdf`;

      if (isMobile) {
        // The window was opened synchronously from the user's tap,
        // so mobile browsers are much less likely to block it.
        pdfWindow.location.href = objectUrl;

        // Give the browser plenty of time to load/read the PDF.
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 60000);
      } else {
        // Desktop: keep the existing direct-download behavior.
        const link = document.createElement('a');

        link.href = objectUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      }

    } catch (error) {
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.close();
      }

      alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  })
);
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
    classSelect.addEventListener('change', () => {
      bulkButton.disabled = !classSelect.value;
    });

    let activeReportPoll = null;

    const closeReportProgress = () => {
      const panel = document.querySelector('#report-job-progress');

      if (panel) {
        panel.remove();
      }
    };

    const showReportProgress = (job) => {
      let panel = document.querySelector('#report-job-progress');

      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'report-job-progress';

        panel.style.cssText = `
          position:fixed;
          inset:0;
          z-index:9999;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
          background:rgba(15,23,42,.55);
          backdrop-filter:blur(4px);
          box-sizing:border-box;
        `;

        document.body.appendChild(panel);
      }

      const total = Number(job.totalStudents || 0);
      const completed = Number(job.completedStudents || 0);

      const percentage = total
        ? Math.min(
            100,
            Math.round((completed / total) * 100)
          )
        : 0;

      const currentStudent =
        job.currentStudentName ||
        job.currentStudentId ||
        'Preparing report cards...';

      let title = 'Generating class report cards';
      let message = 'Please keep this page open while the reports are being generated.';

      if (job.status === 'queued') {
        title = 'Report generation queued';
        message = 'The report-generation worker is starting...';
      }

      if (job.status === 'processing') {
        title = 'Generating class report cards';
        message = `Currently processing: ${escapeHtml(currentStudent)}`;
      }

      if (job.status === 'ready') {
        title = 'Report cards ready';
        message = 'Your ZIP file is ready. Starting the download...';
      }

      if (job.status === 'failed') {
        title = 'Report generation failed';
        message = escapeHtml(
          job.error ||
          'The report-generation job failed.'
        );
      }

      if (job.status === 'expired') {
        title = 'Report job expired';
        message = 'This report-generation job has expired. Please start a new one.';
      }

      panel.innerHTML = `
        <div style="
          width:min(520px,100%);
          background:var(--panel,#ffffff);
          border:1px solid rgba(148,163,184,.25);
          border-radius:18px;
          box-shadow:0 24px 70px rgba(15,23,42,.25);
          padding:26px;
          box-sizing:border-box;
          font-family:inherit;
        ">
          <div style="
            display:flex;
            align-items:flex-start;
            justify-content:space-between;
            gap:16px;
            margin-bottom:20px;
          ">
            <div>
              <div style="
                font-size:12px;
                font-weight:700;
                letter-spacing:.08em;
                text-transform:uppercase;
                color:var(--muted,#64748b);
                margin-bottom:7px;
              ">Report cards</div>

              <h2 style="
                margin:0;
                font-size:22px;
                line-height:1.2;
                color:var(--text,#0f172a);
              ">
                ${title}
              </h2>
            </div>

            <div style="
              min-width:52px;
              height:52px;
              border-radius:14px;
              display:flex;
              align-items:center;
              justify-content:center;
              background:rgba(59,130,246,.10);
              color:var(--primary,#2563eb);
              font-size:15px;
              font-weight:800;
            ">
              ${percentage}%
            </div>
          </div>

          <div style="
            height:10px;
            width:100%;
            overflow:hidden;
            border-radius:999px;
            background:rgba(148,163,184,.20);
            margin-bottom:14px;
          ">
            <div style="
              height:100%;
              width:${percentage}%;
              border-radius:999px;
              background:var(--primary,#2563eb);
              transition:width .35s ease;
            "></div>
          </div>

          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            margin-bottom:16px;
            font-size:14px;
          ">
            <strong style="color:var(--text,#0f172a)">
              ${completed} / ${total}
            </strong>

            <span style="color:var(--muted,#64748b)">
              ${job.status === 'processing' ? 'Processing' : escapeHtml(job.status || 'Starting')}
            </span>
          </div>

          <div style="
            padding:14px;
            border-radius:12px;
            background:rgba(148,163,184,.08);
            color:var(--muted,#64748b);
            font-size:13px;
            line-height:1.55;
          ">
            ${message}
          </div>

          ${
            job.status === 'failed' ||
            job.status === 'expired'
              ? `
                <button
                  type="button"
                  id="close-report-progress"
                  class="outline-btn"
                  style="width:100%;margin-top:16px"
                >
                  Close
                </button>
              `
              : ''
          }
        </div>
      `;

      const closeButton =
        panel.querySelector('#close-report-progress');

      if (closeButton) {
        closeButton.addEventListener(
          'click',
          () => {
            closeReportProgress();
          }
        );
      }
    };

    const downloadReportZip = (
      downloadUrl,
      filename,
      mobileWindow
    ) => {
      if (!downloadUrl) {
        throw new Error(
          'The report ZIP is ready, but no download link was returned.'
        );
      }

      if (mobileWindow && !mobileWindow.closed) {
        mobileWindow.location.href = downloadUrl;
        return;
      }

      const link =
        document.createElement('a');

      link.href = downloadUrl;
      link.download =
        filename ||
        'class-report-cards.zip';

      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    const pollReportJob = async (
      jobId,
      mobileWindow
    ) => {
      if (activeReportPoll) {
        clearInterval(activeReportPoll);
        activeReportPoll = null;
      }

      let finished = false;

      const checkStatus = async () => {
        if (finished) return;

        try {
          const job = await apiRequest(
            `/api/report-cards/bulk/status/${encodeURIComponent(jobId)}`
          );

          showReportProgress(job);

          if (
            job.status === 'queued' ||
            job.status === 'processing'
          ) {
            return;
          }

          finished = true;

          if (activeReportPoll) {
            clearInterval(activeReportPoll);
            activeReportPoll = null;
          }

          if (job.status === 'ready') {
            bulkButton.textContent =
              'Download ready';

            await new Promise(
              resolve => setTimeout(resolve, 500)
            );

            downloadReportZip(
              job.downloadUrl,
              job.filename,
              mobileWindow
            );

            setTimeout(() => {
              closeReportProgress();
            }, 1200);

            return;
          }

          if (mobileWindow && !mobileWindow.closed) {
            mobileWindow.close();
          }

          bulkButton.disabled =
            !classSelect.value;

          showReportProgress(job);

        } catch (error) {
          finished = true;

          if (activeReportPoll) {
            clearInterval(activeReportPoll);
            activeReportPoll = null;
          }

          if (
            mobileWindow &&
            !mobileWindow.closed
          ) {
            mobileWindow.close();
          }

          closeReportProgress();

          alert(
            error.message ||
            'Unable to check report generation status.'
          );

          bulkButton.disabled =
            !classSelect.value;

          bulkButton.textContent =
            'Print all class report cards';
        }
      };

      await checkStatus();

      if (!finished) {
        activeReportPoll =
          setInterval(
            checkStatus,
            2000
          );
      }
    };

    bulkButton.addEventListener(
      'click',
      async () => {
        if (!classSelect.value) {
          return;
        }

        if (activeReportPoll) {
          return;
        }

        const isMobile =
          /Android|iPhone|iPad|iPod|Mobile/i.test(
            navigator.userAgent
          );

        let mobileWindow = null;

        if (isMobile) {
          mobileWindow =
            window.open(
              '',
              '_blank'
            );

          if (!mobileWindow) {
            alert(
              'Your browser blocked the download window. Please allow pop-ups for this site and try again.'
            );
            return;
          }

          mobileWindow.document.title =
            'Generating report cards...';

          mobileWindow.document.body.innerHTML = `
            <div style="
              font-family:system-ui,sans-serif;
              display:flex;
              align-items:center;
              justify-content:center;
              min-height:100vh;
              text-align:center;
              padding:24px;
              box-sizing:border-box;
            ">
              <div>
                <h2>Generating report cards...</h2>
                <p>Please keep this window open.</p>
              </div>
            </div>
          `;
        }

        bulkButton.disabled = true;
        bulkButton.textContent =
          'Starting report generation...';

        try {
          const response =
            await apiRequest(
              '/api/report-cards/bulk/start',
              {
                method:'POST',
                body:JSON.stringify({
                  class_id:
                    Number(classSelect.value),

                  academic_year_id:
                    Number(yearSelect.value),

                  term_id:
                    Number(termSelect.value),

                  sequence_id:
                    Number(sequenceSelect.value)
                })
              }
            );

          if (!response.jobId) {
            throw new Error(
              'The report job could not be started.'
            );
          }

          showReportProgress({
            jobId:response.jobId,
            status:response.status || 'queued',
            totalStudents:
              Number(response.totalStudents || 0),
            completedStudents:0,
            currentStudentId:null,
            currentStudentName:null
          });

          bulkButton.textContent =
            'Generating PDFs...';

          await pollReportJob(
            response.jobId,
            mobileWindow
          );

        } catch (error) {
          if (
            mobileWindow &&
            !mobileWindow.closed
          ) {
            mobileWindow.close();
          }

          closeReportProgress();

          alert(
            error.message ||
            'Unable to start report generation.'
          );

          bulkButton.disabled =
            !classSelect.value;

          bulkButton.textContent =
            'Print all class report cards';
        }
      }
    );

    await loadTerms();
  } catch (error) { list.innerHTML = `<tr><td colspan="8" class="empty" style="color:var(--danger)">${escapeHtml(error.message)}</td></tr>`; }
}
function assignmentsPage() {
  return `<div class="view">${header(
    'Administration',
    'Teacher assignments',
    'Assign teachers to multiple subjects and classes.',
    '<button class="outline-btn" data-view="dashboard">Back to overview</button>'
  )}

  <article class="panel" style="position:relative;z-index:50">
    <div class="panel-header">
      <div>
        <h2 class="panel-title" id="assignment-form-title">Create assignment</h2>
        <p class="panel-note">Select a teacher, subjects and classes.</p>
      </div>
    </div>

    <div class="panel-body">

      <div class="form-grid" style="align-items:start">

        <div>
          <label class="field-label" style="margin-top:0">Teacher</label>
          <select
            class="select"
            id="assignment-teacher"
            style="height:46px;min-height:46px"
          >
            <option>Loading teachers...</option>
          </select>
        </div>

        <div style="position:relative;z-index:30">
          <label class="field-label" style="margin-top:0">Subjects</label>

          <details id="assignment-subject-dropdown">
            <summary
              id="assignment-subject-summary"
              style="cursor:pointer;list-style:none;border:1px solid var(--line);border-radius:10px;padding:0 14px;background:var(--panel);height:46px;display:flex;align-items:center;justify-content:space-between"
            >
              <span>Select subjects</span>
              <span style="color:var(--muted)">⌄</span>
            </summary>

            <div
              id="assignment-subject-list"
              style="position:absolute;top:54px;left:0;width:100%;max-height:280px;overflow-y:auto;padding:8px;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:1000"
            >
              <span class="panel-note">Loading subjects...</span>
            </div>
          </details>
        </div>

        <div style="position:relative;z-index:29">
          <label class="field-label" style="margin-top:0">Classes</label>

          <details id="assignment-class-dropdown">
            <summary
              id="assignment-class-summary"
              style="cursor:pointer;list-style:none;border:1px solid var(--line);border-radius:10px;padding:0 14px;background:var(--panel);height:46px;display:flex;align-items:center;justify-content:space-between"
            >
              <span>Select classes</span>
              <span style="color:var(--muted)">⌄</span>
            </summary>

            <div
              id="assignment-class-list"
              style="position:absolute;top:54px;left:0;width:100%;max-height:280px;overflow-y:auto;padding:8px;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:999"
            >
              <span class="panel-note">Loading classes...</span>
            </div>
          </details>
        </div>

      </div>

      <label class="check" style="margin:16px 0">
        <input type="checkbox" id="assignment-all-classes">
        Apply selected subjects to all active classes
      </label>

      <div>
        <button class="primary-btn" id="save-assignment">Assign teacher</button>
        <button class="outline-btn" id="cancel-edit-assignment" style="display:none;margin-left:8px">Cancel</button>
      </div>

      <p class="panel-note" id="assignment-message" style="margin-top:12px"></p>
    </div>
  </article>

  <article class="panel" style="margin-top:16px;position:relative;z-index:1">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">Active assignments</h2>
        <p class="panel-note">Teachers can only enter marks for assignments created here.</p>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Teacher</th>
            <th>Subject</th>
            <th>Class</th>
            <th>Academic year</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="assignment-list">
          <tr>
            <td colspan="6" class="empty">Loading assignments...</td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>

  </div>`;
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

function administratorsPage() {
  return `<div class="view">${header(
    'Administration',
    'Administrator Accounts',
    'Create and manage administrator accounts.',
    '<button class="outline-btn" data-view="dashboard">Back to overview</button>'
  )}<article class="panel"><div class="panel-header"><div><h2 class="panel-title">Create administrator</h2><p class="panel-note">The new administrator can sign in immediately with the password you provide.</p></div></div><div class="panel-body"><div class="form-grid"><input class="field" id="new-admin-name" placeholder="Full name"><input class="field" id="new-admin-email" type="email" placeholder="Email address"><input class="field" id="new-admin-password" type="password" placeholder="Temporary password"></div><button class="primary-btn" id="save-admin">Create administrator</button><p class="panel-note" id="admin-form-message" style="margin-top:12px"></p></div></article><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Administrator accounts</h2><p class="panel-note">Administrator passwords are never displayed.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead><tbody id="admin-list"><tr><td colspan="3" class="empty">Loading administrators...</td></tr></tbody></table></div></article></div>`;
}

function teachersPage() {
  return `<div class="view">${header('Administration', 'Teachers', 'Create, manage, and deactivate teacher accounts.', '<button class="outline-btn" data-view="dashboard">Back to overview</button>')}<article class="panel"><div class="panel-header"><div><h2 class="panel-title">Add teacher</h2><p class="panel-note">The teacher can sign in immediately, then receive subject and class assignments.</p></div></div><div class="panel-body"><div class="form-grid"><input class="field" id="new-teacher-name" placeholder="Full name"><input class="field" id="new-teacher-email" type="email" placeholder="Email address"><input class="field" id="new-teacher-password" type="password" placeholder="Initial password"></div><button class="primary-btn" id="save-teacher">Create teacher account</button><p class="panel-note" id="teacher-form-message" style="margin-top:12px"></p></div></article><article class="panel" style="margin-top:16px"><div class="panel-header"><div><h2 class="panel-title">Active teachers</h2><p class="panel-note">Deactivating a teacher also removes active subject/class assignments.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Assignments</th><th>Status</th><th>Action</th></tr></thead><tbody id="teacher-list"><tr><td colspan="5" class="empty">Loading teachers...</td></tr></tbody></table></div></article></div>`;
}

async function hydrateAdministrators() {
  if (window.location.protocol === 'file:') return;

  try {
    const renderAdministrators = records => {
      const page = pagedRecords('administrators', records);
      const adminList = document.querySelector('#admin-list');
      adminList.innerHTML =
        page.records.map(item => `
          <tr>
            <td class="student-name">${escapeHtml(item.full_name)}</td>
            <td>${escapeHtml(item.email)}</td>
            <td><span class="status ${item.is_active ? 'active' : 'inactive'}">${item.is_active ? 'Active' : 'Inactive'}</span></td>
          </tr>
        `).join('') ||
        '<tr><td colspan="3" class="empty">No administrator accounts found.</td></tr>';
      const adminPanel = adminList.closest('.panel');
      adminPanel?.querySelector('.pagination')?.remove();
      if (page.total) adminPanel?.insertAdjacentHTML('beforeend', paginationMarkup('administrators', page.page, page.totalPages, page.total, page.start));
      if (adminPanel) bindPagination(adminPanel, 'administrators', () => renderAdministrators(records));
    };

    const response = await apiRequest('/api/admin/administrators');
    renderAdministrators(response.administrators);

    document.querySelector('#save-admin').addEventListener('click', async () => {
      const message = document.querySelector('#admin-form-message');

      try {
        await apiRequest('/api/admin/administrators', {
          method: 'POST',
          body: JSON.stringify({
            full_name: document.querySelector('#new-admin-name').value,
            email: document.querySelector('#new-admin-email').value,
            password: document.querySelector('#new-admin-password').value
          })
        });

        message.textContent = 'Administrator account created successfully.';
        message.style.color = 'var(--positive)';

        document.querySelector('#new-admin-name').value = '';
        document.querySelector('#new-admin-email').value = '';
        document.querySelector('#new-admin-password').value = '';

        const refreshed = await apiRequest('/api/admin/administrators');
        renderAdministrators(refreshed.administrators);

      } catch (exception) {
        message.textContent = exception.message;
        message.style.color = 'var(--danger)';
      }
    });

  } catch (exception) {
    document.querySelector('#admin-list').innerHTML =
      `<tr><td colspan="3" class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</td></tr>`;
  }
}

async function hydrateSubjects() {
  if (window.location.protocol === 'file:') return;

  try {
    const renderSubjects = records => {
      const page = pagedRecords('subjects', records);
      const subjectList = document.querySelector('#subject-list');
      subjectList.innerHTML =
        page.records.map(item => `
          <tr>
            <td class="student-name">${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.code)}</td>
            <td>${escapeHtml(item.max_mark)}</td>
            <td>${escapeHtml(item.coefficient)}</td>
            <td>${escapeHtml(item.category || '—')}</td>
            <td>
              <span class="status ${item.is_active ? 'active' : 'inactive'}">
                ${item.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <button
                class="outline-btn edit-subject"
                data-subject-id="${item.id}"
              >
                Edit
              </button>

              ${
                item.is_active
                  ? `<button
                       class="outline-btn deactivate-subject"
                       data-subject-id="${item.id}"
                       style="margin-left:6px"
                     >
                       Deactivate
                     </button>`
                  : `<button
                       class="outline-btn activate-subject"
                       data-subject-id="${item.id}"
                       style="margin-left:6px"
                     >
                       Activate
                     </button>`
              }
            </td>
          </tr>
        `).join('') ||
        '<tr><td colspan="7" class="empty">No subjects found.</td></tr>';

      const subjectPanel = subjectList.closest('.panel');
      subjectPanel?.querySelector('.pagination')?.remove();
      if (page.total) subjectPanel?.insertAdjacentHTML('beforeend', paginationMarkup('subjects', page.page, page.totalPages, page.total, page.start));
      if (subjectPanel) bindPagination(subjectPanel, 'subjects', () => renderSubjects(records));

      document.querySelectorAll('.edit-subject').forEach(button => {
        button.addEventListener('click', () => {
          const subject = records.find(
            item => String(item.id) === String(button.dataset.subjectId)
          );

          if (!subject) return;

          document.querySelector('#subject-form-title').textContent =
            'Edit subject';

          document.querySelector('#new-subject-name').value =
            subject.name || '';

          document.querySelector('#new-subject-code').value =
            subject.code || '';

          document.querySelector('#new-subject-max').value =
            subject.max_mark ?? '';

          document.querySelector('#new-subject-coef').value =
            subject.coefficient ?? '';

          document.querySelector('#new-subject-category').value =
            subject.category || '';

          document.querySelector('#new-subject-active').checked =
            !!subject.is_active;

          const saveButton =
            document.querySelector('#save-subject');

          saveButton.textContent = 'Update subject';
          saveButton.dataset.editingId = subject.id;

          document.querySelector('#cancel-edit-subject').style.display =
            'inline-flex';

          document.querySelector('#subject-form-message').textContent = '';

          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      });

      document.querySelectorAll('.deactivate-subject').forEach(button => {
        button.addEventListener('click', async () => {
          const subject = records.find(
            item => String(item.id) === String(button.dataset.subjectId)
          );

          if (!subject) return;

          if (!confirm(`Deactivate ${subject.name}?`)) {
            return;
          }

          try {
            await apiRequest(
              `/api/admin/subjects/${subject.id}`,
              {
                method: 'DELETE'
              }
            );

            const refreshed =
              await apiRequest('/api/admin/subjects');

            renderSubjects(refreshed.subjects);

          } catch (exception) {
            const message =
              document.querySelector('#subject-form-message');

            message.textContent = exception.message;
            message.style.color = 'var(--danger)';
          }
        });
      });

      document.querySelectorAll('.activate-subject').forEach(button => {
        button.addEventListener('click', async () => {
          const subject = records.find(
            item => String(item.id) === String(button.dataset.subjectId)
          );

          if (!subject) return;

          if (!confirm(`Activate ${subject.name}?`)) {
            return;
          }

          try {
            await apiRequest(
              `/api/admin/subjects/${subject.id}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  name: subject.name,
                  code: subject.code,
                  max_mark: subject.max_mark,
                  coefficient: subject.coefficient,
                  category: subject.category || '',
                  is_active: true
                })
              }
            );

            const refreshed =
              await apiRequest('/api/admin/subjects');

            renderSubjects(refreshed.subjects);

          } catch (exception) {
            const message =
              document.querySelector('#subject-form-message');

            message.textContent = exception.message;
            message.style.color = 'var(--danger)';
          }
        });
      });
    };

    const response =
      await apiRequest('/api/admin/subjects');

    renderSubjects(response.subjects);

    const saveButton =
      document.querySelector('#save-subject');

    const cancelButton =
      document.querySelector('#cancel-edit-subject');

    const resetForm = () => {
      document.querySelector('#subject-form-title').textContent =
        'Add subject';

      document.querySelector('#new-subject-name').value = '';
      document.querySelector('#new-subject-code').value = '';
      document.querySelector('#new-subject-max').value = '';
      document.querySelector('#new-subject-coef').value = '';
      document.querySelector('#new-subject-category').value = '';
      document.querySelector('#new-subject-active').checked = true;

      saveButton.textContent = 'Create subject';
      delete saveButton.dataset.editingId;

      cancelButton.style.display = 'none';
    };

    cancelButton.addEventListener('click', () => {
      resetForm();

      document.querySelector('#subject-form-message').textContent = '';
    });

    saveButton.addEventListener('click', async () => {
      const message =
        document.querySelector('#subject-form-message');

      try {
        const payload = {
          name: document.querySelector('#new-subject-name').value,
          code: document.querySelector('#new-subject-code').value,
          max_mark: document.querySelector('#new-subject-max').value,
          coefficient: document.querySelector('#new-subject-coef').value,
          category: document.querySelector('#new-subject-category').value,
          is_active:
            document.querySelector('#new-subject-active').checked
        };

        const editingId =
          saveButton.dataset.editingId;

        if (editingId) {
          await apiRequest(
            `/api/admin/subjects/${editingId}`,
            {
              method: 'PUT',
              body: JSON.stringify(payload)
            }
          );

          message.textContent =
            'Subject updated successfully.';

        } else {
          await apiRequest(
            '/api/admin/subjects',
            {
              method: 'POST',
              body: JSON.stringify(payload)
            }
          );

          message.textContent =
            'Subject created successfully.';
        }

        message.style.color = 'var(--positive)';

        resetForm();

        const refreshed =
          await apiRequest('/api/admin/subjects');

        renderSubjects(refreshed.subjects);

      } catch (exception) {
        message.textContent = exception.message;
        message.style.color = 'var(--danger)';
      }
    });

  } catch (exception) {
    document.querySelector('#subject-list').innerHTML =
      `<tr>
        <td colspan="7" class="empty" style="color:var(--danger)">
          ${escapeHtml(exception.message)}
        </td>
      </tr>`;
  }
}

async function hydrateTeachers() {
  if (window.location.protocol === 'file:') return;
  try {
    const renderTeachers = records => { const page = pagedRecords('teachers', records); const body = document.querySelector('#teacher-list'); body.innerHTML = page.records.map(item => `<tr><td class="student-name">${escapeHtml(item.full_name)}</td><td>${escapeHtml(item.email)}</td><td>${item.assignment_count || 0}</td><td><span class="status ${item.is_active === false ? 'inactive' : 'active'}">${item.is_active === false ? 'Inactive' : 'Active'}</span></td><td><button class="outline-btn deactivate-teacher" data-teacher-id="${item.id}">Deactivate</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No teachers found.</td></tr>'; const panel=body.closest('.panel'); panel?.querySelector('.pagination')?.remove(); if(page.total) panel?.insertAdjacentHTML('beforeend', paginationMarkup('teachers', page.page, page.totalPages, page.total, page.start)); document.querySelectorAll('.deactivate-teacher').forEach(button => button.addEventListener('click', async () => { if (!confirm('Deactivate this teacher and remove active assignments?')) return; await apiRequest(`/api/admin/teachers/${button.dataset.teacherId}`, { method: 'DELETE' }); listPages.teachers=1; const refreshed = await apiRequest('/api/admin/teachers'); renderTeachers(refreshed.teachers); })); if(panel) bindPagination(panel,'teachers',()=>renderTeachers(records)); };
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
      const page = pagedRecords('classes', rows);
      const classList = document.querySelector('#class-list');
      classList.innerHTML = page.records.map(item => `
        <tr data-class-id="${item.id}" data-name="${escapeHtml(item.name)}" data-master-id="${item.class_master_id || ''}" data-year-id="${item.academic_year_id}">
          <td class="student-name">${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.academic_year || 'Current year')}</td>
          <td>${escapeHtml(item.class_master_name || 'Unassigned')}</td>
          <td><span class="status ${item.is_active === false ? 'inactive' : 'active'}">${item.is_active === false ? 'Inactive' : 'Active'}</span></td>
          <td>
            <button class="outline-btn download-classlist-btn" data-class-id="${item.id}" data-class-year-id="${item.academic_year_id || ''}">Download list</button>
            <button class="outline-btn edit-class-btn" data-class-id="${item.id}">Edit</button>
            <button class="outline-btn delete-class-btn" data-class-id="${item.id}">Delete</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="5" class="empty">No classes created yet.</td></tr>';
      const classPanel = classList.closest('.panel');
      classPanel?.querySelector('.pagination')?.remove();
      if (page.total) classPanel?.insertAdjacentHTML('beforeend', paginationMarkup('classes', page.page, page.totalPages, page.total, page.start));

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

          const disposition =
            response.headers.get('Content-Disposition') || '';

          const filenameMatch =
            disposition.match(/filename="([^"]+)"/i);

          const filename =
            filenameMatch?.[1] ||
            `class-list-${classId}.pdf`;

          link.href = objectUrl;
          link.download = filename;

          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
          }, 1000);
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
      if (classPanel) bindPagination(classPanel, 'classes', () => renderClasses(rows));
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
    document.querySelector('#assignment-message').textContent =
      'Open http://localhost:3000/ to manage live assignments.';
    document.querySelector('#assignment-message').style.color =
      'var(--warning)';
    return;
  }

  try {
    const [teachers, subjects, classes, assignments] = await Promise.all([
      apiRequest('/api/admin/teachers'),
      apiRequest('/api/subjects'),
      apiRequest('/api/classes'),
      apiRequest('/api/admin/assignments')
    ]);

    const teacherSelect = document.querySelector('#assignment-teacher');
    const subjectList = document.querySelector('#assignment-subject-list');
    const classList = document.querySelector('#assignment-class-list');
    const subjectSummary = document.querySelector('#assignment-subject-summary');
    const classSummary = document.querySelector('#assignment-class-summary');
    const allClasses = document.querySelector('#assignment-all-classes');

    teacherSelect.innerHTML = teachers.teachers.map(item =>
      `<option value="${item.id}">${escapeHtml(item.full_name)} ? ${escapeHtml(item.email)}</option>`
    ).join('');

    subjectList.innerHTML = subjects.subjects.map(item =>
      `<label class="selection-option" style="display:flex;align-items:center;gap:10px;padding:9px 6px;cursor:pointer">
        <input type="checkbox" name="assignment-subject" value="${item.id}">
        <span>${escapeHtml(item.name)} <span style="color:var(--muted)">(${escapeHtml(item.code)})</span></span>
      </label>`
    ).join('') || '<span class="panel-note">No active subjects found.</span>';

    classList.innerHTML = classes.classes.map(item =>
      `<label class="selection-option" style="display:flex;align-items:center;gap:10px;padding:9px 6px;cursor:pointer">
        <input type="checkbox" name="assignment-class" value="${item.id}">
        <span>${escapeHtml(item.name)}</span>
      </label>`
    ).join('') || '<span class="panel-note">No active classes found.</span>';

    const updateSubjectSummary = () => {
      const selected = [...document.querySelectorAll('input[name="assignment-subject"]:checked')];

      subjectSummary.querySelector('span').textContent =
        selected.length === 0
          ? 'Select subjects'
          : selected.length === 1
            ? '1 subject selected'
            : `${selected.length} subjects selected`;
    };

    const updateClassSummary = () => {
      const selected = [...document.querySelectorAll('input[name="assignment-class"]:checked')];

      classSummary.querySelector('span').textContent =
        allClasses.checked
          ? 'All active classes'
          : selected.length === 0
            ? 'Select classes'
            : selected.length === 1
              ? '1 class selected'
              : `${selected.length} classes selected`;
    };

    document
      .querySelectorAll('input[name="assignment-subject"]')
      .forEach(input => input.addEventListener('change', updateSubjectSummary));

    document
      .querySelectorAll('input[name="assignment-class"]')
      .forEach(input => input.addEventListener('change', updateClassSummary));

    allClasses.addEventListener('change', () => {
      document
        .querySelectorAll('input[name="assignment-class"]')
        .forEach(input => {
          input.checked = allClasses.checked || input.checked;
          input.disabled = allClasses.checked;
        });

      updateClassSummary();
    });

    const renderAssignments = rows => {
      const page = pagedRecords('assignments', rows);
      const assignmentList = document.querySelector('#assignment-list');
      assignmentList.innerHTML =
        page.records.map(item => `
          <tr
            data-id="${item.id}"
            data-teacher-id="${item.teacher_id}"
            data-subject-id="${item.subject_id}"
            data-class-id="${item.class_id}"
          >
            <td class="student-name">${escapeHtml(item.teacher_name)}</td>
            <td>${escapeHtml(item.subject_name)} <span style="color:var(--muted)">(${escapeHtml(item.subject_code)})</span></td>
            <td>${escapeHtml(item.class_name)}</td>
            <td>${escapeHtml(item.academic_year)}</td>
            <td><span class="status active">Active</span></td>
            <td>
              <button class="outline-btn edit-assignment-btn" data-assignment-id="${item.id}">Edit</button>
              <button class="outline-btn delete-assignment-btn" data-assignment-id="${item.id}">Remove</button>
            </td>
          </tr>
        `).join('') ||
        '<tr><td colspan="6" class="empty">No assignments created yet.</td></tr>';
      const assignmentPanel = assignmentList.closest('.panel');
      assignmentPanel?.querySelector('.pagination')?.remove();
      if (page.total) assignmentPanel?.insertAdjacentHTML('beforeend', paginationMarkup('assignments', page.page, page.totalPages, page.total, page.start));

      document.querySelectorAll('.edit-assignment-btn').forEach(button => {
        button.addEventListener('click', () => {
          const row = button.closest('tr');

          state.editingAssignmentId = Number(button.dataset.assignmentId);

          teacherSelect.value = row.dataset.teacherId;

          document
            .querySelectorAll('input[name="assignment-subject"]')
            .forEach(input => {
              input.checked =
                Number(input.value) === Number(row.dataset.subjectId);
            });

          allClasses.checked = false;

          document
            .querySelectorAll('input[name="assignment-class"]')
            .forEach(input => {
              input.disabled = false;
              input.checked =
                Number(input.value) === Number(row.dataset.classId);
            });

          updateSubjectSummary();
          updateClassSummary();

          document.querySelector('#save-assignment').textContent =
            'Update assignment';

          document.querySelector('#cancel-edit-assignment').style.display =
            'inline-block';

          document.querySelector('#assignment-form-title').textContent =
            'Edit assignment';
        });
      });

      if (assignmentPanel) bindPagination(assignmentPanel, 'assignments', () => renderAssignments(rows));

      document.querySelectorAll('.delete-assignment-btn').forEach(button => {
        button.addEventListener('click', async () => {
          if (!confirm('Deactivate this teacher assignment?')) return;

          const message = document.querySelector('#assignment-message');

          try {
            await apiRequest(
              `/api/admin/assignments/${button.dataset.assignmentId}`,
              { method: 'DELETE' }
            );

            message.textContent =
              'Teacher assignment removed successfully.';
            message.style.color = 'var(--positive)';

            const refreshed =
              await apiRequest('/api/admin/assignments');

            renderAssignments(refreshed.assignments);
          } catch (exception) {
            message.textContent = exception.message;
            message.style.color = 'var(--danger)';
          }
        });
      });
    };

    const resetAssignmentForm = () => {
      state.editingAssignmentId = null;

      document.querySelector('#save-assignment').textContent =
        'Assign teacher';

      document.querySelector('#cancel-edit-assignment').style.display =
        'none';

      document.querySelector('#assignment-form-title').textContent =
        'Create assignment';

      document
        .querySelectorAll('input[name="assignment-subject"]')
        .forEach(input => input.checked = false);

      document
        .querySelectorAll('input[name="assignment-class"]')
        .forEach(input => {
          input.checked = false;
          input.disabled = false;
        });

      allClasses.checked = false;

      updateSubjectSummary();
      updateClassSummary();

      document
        .querySelector('#assignment-subject-dropdown')
        ?.removeAttribute('open');

      document
        .querySelector('#assignment-class-dropdown')
        ?.removeAttribute('open');
    };

    state.editingAssignmentId = null;

    document
      .querySelector('#cancel-edit-assignment')
      .addEventListener('click', resetAssignmentForm);

    renderAssignments(assignments.assignments);

    document
      .querySelector('#save-assignment')
      .addEventListener('click', async () => {
        const button = document.querySelector('#save-assignment');
        const message = document.querySelector('#assignment-message');

        button.disabled = true;

        try {
          const selectedSubjects = [
            ...document.querySelectorAll(
              'input[name="assignment-subject"]:checked'
            )
          ].map(input => Number(input.value));

          const selectedClasses = [
            ...document.querySelectorAll(
              'input[name="assignment-class"]:checked'
            )
          ].map(input => Number(input.value));

          if (!selectedSubjects.length) {
            throw new Error('Select at least one subject.');
          }

          if (
            !allClasses.checked &&
            !selectedClasses.length
          ) {
            throw new Error('Select at least one class.');
          }

          if (state.editingAssignmentId) {
            await apiRequest(
              `/api/admin/assignments/${state.editingAssignmentId}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  teacher_id: Number(teacherSelect.value),
                  subject_id: selectedSubjects[0],
                  class_id: selectedClasses[0] || 0
                })
              }
            );

            message.textContent =
              'Assignment updated successfully.';

            message.style.color = 'var(--positive)';

            resetAssignmentForm();
          } else {
            await apiRequest('/api/admin/assignments', {
              method: 'POST',
              body: JSON.stringify({
                teacher_id: Number(teacherSelect.value),
                subject_ids: selectedSubjects,
                all_classes: allClasses.checked,
                class_ids: selectedClasses
              })
            });

            message.textContent =
              'Teacher assigned successfully. The assignment is now visible on the teacher dashboard.';

            message.style.color = 'var(--positive)';

            document
              .querySelectorAll('input[name="assignment-subject"]')
              .forEach(input => input.checked = false);

            document
              .querySelectorAll('input[name="assignment-class"]')
              .forEach(input => {
                input.checked = false;
                input.disabled = false;
              });

            allClasses.checked = false;

            updateSubjectSummary();
            updateClassSummary();
          }

          const refreshed =
            await apiRequest('/api/admin/assignments');

          renderAssignments(refreshed.assignments);

        } catch (exception) {
          message.textContent = exception.message;
          message.style.color = 'var(--danger)';
        }

        button.disabled = false;
      });

  } catch (exception) {
    document.querySelector('#assignment-list').innerHTML =
      `<tr><td colspan="6" class="empty" style="color:var(--danger)">${escapeHtml(exception.message)}</td></tr>`;
  }
}

const LIST_PAGE_SIZE = 15;
const listPages = Object.create(null);

function pagedRecords(key, records) {
  const safe = Array.isArray(records) ? records : [];
  const totalPages = Math.max(1, Math.ceil(safe.length / LIST_PAGE_SIZE));
  const page = Math.min(Math.max(1, listPages[key] || 1), totalPages);
  listPages[key] = page;
  const start = (page - 1) * LIST_PAGE_SIZE;
  return { records: safe.slice(start, start + LIST_PAGE_SIZE), page, totalPages, total: safe.length, start };
}

function paginationMarkup(key, page, totalPages, total, start) {
  if (!total || totalPages <= 1) {
    return total ? `<div class="table-meta"><span>Showing ${start + 1}–${start + Math.min(LIST_PAGE_SIZE, total)} of ${total}</span></div>` : '';
  }
  const buttons = [];
  const add = (p, label, disabled=false, current=false) => buttons.push(`<button type="button" class="pagination-btn${current ? ' active' : ''}" data-page-key="${key}" data-page="${p}" ${disabled ? 'disabled' : ''}>${label}</button>`);
  add(page - 1, '‹', page === 1);
  const pages = [];
  const push = p => { if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p); };
  push(1); push(totalPages); for (let p = page - 2; p <= page + 2; p++) push(p);
  pages.sort((a,b)=>a-b);
  let prev = 0;
  for (const p of pages) { if (prev && p - prev > 1) buttons.push('<span class="pagination-ellipsis">…</span>'); add(p, String(p), false, p === page); prev = p; }
  add(page + 1, '›', page === totalPages);
  const from = start + 1;
  const to = Math.min(start + LIST_PAGE_SIZE, total);
  return `<div class="pagination"><div class="table-meta">Showing ${from}–${to} of ${total}</div><div class="pagination-controls">${buttons.join('')}</div></div>`;
}

function bindPagination(container, key, rerender) {
  container.querySelectorAll('.pagination-btn[data-page-key]').forEach(button => {
    button.addEventListener('click', () => {
      const page = Number(button.dataset.page);
      if (!Number.isFinite(page)) return;
      listPages[key] = page;
      rerender();
      container.closest('.panel')?.querySelector('.pagination-btn.active')?.focus();
    });
  });
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
  app.innerHTML = `<div class="login"><section class="login-card"><div class="login-brand"><div class="brand-mark"><img src="/assets/school-logo.jpeg" alt="Atlantic Bilingual College Mabanda"></div><h1 class="login-title">${registering ? 'Create teacher account' : 'Welcome back'}</h1><p class="login-copy">${registering ? 'Register your Mabanda teaching account' : 'Sign in to your academic workspace'}</p></div>${registering ? '<label class="field-label" for="full-name">Full name</label><input class="field" id="full-name" placeholder="e.g. Mrs. Sarah Mbida" type="text">' : ''}<label class="field-label" for="email">Email address</label><input class="field" id="email" type="email" autocomplete="username" placeholder="Email address"><label class="field-label" for="password">Password</label><input class="field" id="password" type="password" autocomplete="current-password" placeholder="Password">${registering ? '<label class="field-label" for="confirm-password">Confirm password</label><input class="field" id="confirm-password" type="password">' : '<div class="login-row"><label class="check"><input type="checkbox" checked> Remember me</label><button class="text-link">Forgot password?</button></div>'}<button class="primary-btn login-submit" id="${registering ? 'register-button' : 'login-button'}">${registering ? 'Create teacher account' : 'Sign in to Mabanda'}</button><p class="login-foot" id="login-error">${registering ? 'Teacher accounts can be assigned subjects and classes by an administrator.' : 'Need an account?'} <button class="text-link" id="toggle-auth">${registering ? 'Back to sign in' : 'Register as a teacher'}</button></p></section></div>`;
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
  const previewRows = window.location.protocol === 'file:' ? students.map(student => `<tr><td class="student-name">${student[1]}</td><td>${student[0]}</td><td><input class="field entry-mark" value="${student[4].split(' ')[0]}" placeholder="?"></td><td>${student[5]}</td></tr>`).join('') : '<tr><td colspan="4" class="empty">Choose a class to load students.</td></tr>';
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
        const evaluation = saved ? `${saved.percentage}% ? ${saved.evaluation}` : 'Not entered';
        return `<tr data-student-id="${student.id}"><td class="student-name">${student.full_name}</td><td>${student.student_id}</td><td><input class="field entry-mark" value="${saved ? saved.mark : ''}" placeholder="?" inputmode="decimal"></td><td class="evaluation">${evaluation}</td></tr>`;
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
    document.querySelector('#analytics-stats').innerHTML = [['Overall average', `${data.overall_average}%`], ['Pass percentage', `${data.pass_percentage}%`], ['Best class', data.best_class?.name || '?'], ['Students', data.total_students]].map(item => `<article class="panel stat-card"><div class="stat-head"><span>${item[0]}</span></div><div class="stat-value">${item[1]}</div></article>`).join('');
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

function teacherClassesPage() {
  return `<div class="view">${header(
    'Teacher workspace',
    'My Classes',
    'Classes assigned to you for result entry.'
  )}<article class="panel"><div class="panel-header"><div><h2 class="panel-title">Assigned classes</h2><p class="panel-note">These are the classes connected to your teaching assignments.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Class</th><th>Subject</th><th>Action</th></tr></thead><tbody id="teacher-my-classes"><tr><td colspan="3" class="empty">Loading classes...</td></tr></tbody></table></div></article></div>`;
}

function teacherSubjectsPage() {
  return `<div class="view">${header(
    'Teacher workspace',
    'My Subjects',
    'Subjects assigned to you for result entry.'
  )}<article class="panel"><div class="panel-header"><div><h2 class="panel-title">Assigned subjects</h2><p class="panel-note">Only subjects assigned to your account are shown here.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Subject</th><th>Class</th><th>Action</th></tr></thead><tbody id="teacher-my-subjects"><tr><td colspan="3" class="empty">Loading subjects...</td></tr></tbody></table></div></article></div>`;
}

function teacherProfilePage() {
  const user = state.user || {};
  const initials = (user.full_name || 'Teacher')
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return `<div class="view">${header(
    'Teacher workspace',
    'My Profile',
    'Manage your account and security settings.'
  )}<section class="grid split-grid">
    <article class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Profile</h2>
          <p class="panel-note">Your school account information.</p>
        </div>
      </div>
      <div class="panel-body">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div class="avatar" style="width:52px;height:52px;font-size:18px">${initials}</div>
          <div>
            <strong style="display:block;color:var(--text);font-size:16px">${escapeHtml(user.full_name || 'Teacher')}</strong>
            <span>${escapeHtml(user.email || '')}</span>
          </div>
        </div>
        <div class="form-grid">
          <div>
            <label class="field-label">Full name</label>
            <input class="field" value="${escapeHtml(user.full_name || '')}" disabled>
          </div>
          <div>
            <label class="field-label">Email</label>
            <input class="field" value="${escapeHtml(user.email || '')}" disabled>
          </div>
          <div>
            <label class="field-label">Role</label>
            <input class="field" value="Teacher" disabled>
          </div>
        </div>
      </div>
    </article>

    <article class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Security</h2>
          <p class="panel-note">Change your password so only you know it.</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          <div>
            <label class="field-label" for="teacher-current-password">Current password</label>
            <input class="field" id="teacher-current-password" type="password" autocomplete="current-password">
          </div>
          <div>
            <label class="field-label" for="teacher-new-password">New password</label>
            <input class="field" id="teacher-new-password" type="password" autocomplete="new-password">
          </div>
          <div>
            <label class="field-label" for="teacher-confirm-password">Confirm new password</label>
            <input class="field" id="teacher-confirm-password" type="password" autocomplete="new-password">
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:16px">
          <button class="primary-btn" id="teacher-change-password" type="button">Change Password</button>
          <span id="teacher-password-message"></span>
        </div>
      </div>
    </article>
  </section></div>`;
}

function studentsPage() {
  return `<div class="view">${header('Student records', 'Students', 'Register students, manage class placement, and review performance history.', '<button class="primary-btn" id="register-student">+ Register student</button>')}<article class="panel" id="student-form-panel" style="display:none;margin-bottom:16px"><div class="panel-header"><div><h2 class="panel-title">Register student</h2><p class="panel-note">The student will be enrolled in the selected class and academic year.</p></div></div><div class="panel-body"><div class="form-grid"><input class="field" id="new-student-id" placeholder="Student ID"><input class="field" id="new-registration-number" placeholder="Matricule number"><input class="field" id="new-full-name" placeholder="Full name"><select class="select" id="new-gender"><option value="">Gender</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select><input class="field" id="new-date-of-birth" type="date"><input class="field" id="new-guardian-name" placeholder="Parent/guardian name"><input class="field" id="new-guardian-phone" placeholder="Parent/guardian phone"><select class="select" id="new-class"><option>Loading classes...</option></select><select class="select" id="new-year"><option>Loading years...</option></select></div><button class="primary-btn" id="save-student">Register student</button><button class="outline-btn" id="cancel-student" style="margin-left:8px">Cancel</button><p class="panel-note" id="student-form-message" style="margin-top:12px"></p></div></article><article class="panel"><div class="toolbar" style="padding:20px 22px 0"><input class="search" id="student-search" placeholder="Search students..."><span class="panel-note" id="student-count">Loading records...</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Academic year</th><th>Status</th><th>Actions</th></tr></thead><tbody id="student-directory"><tr><td colspan="6" class="empty">Loading students...</td></tr></tbody></table></div></article><article class="panel" id="student-history-panel" style="margin-top:16px;display:none"></article></div>`;
}

async function hydrateStudents() {
  if (window.location.protocol === 'file:') {
    document.querySelector('#student-directory').innerHTML = students.map(student => `<tr><td class="student-name">${student[1]}</td><td>${student[0]}</td><td>${student[2]}</td><td>2026/2027</td><td><span class="status active">Active</span></td><td><button class="outline-btn">Profile</button></td></tr>`).join('');
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
      const page = pagedRecords('students', records);
      directory.innerHTML = page.records.map(student => `<tr><td class="student-name">${escapeHtml(student.full_name)}</td><td>${escapeHtml(student.student_id)}</td><td>${escapeHtml(student.class_name || 'Unassigned')}</td><td>${escapeHtml(student.academic_year || '—')}</td><td><span class="status ${student.is_active === false ? 'inactive' : ''}">${student.is_active === false ? 'Inactive' : 'Active'}</span></td><td><button class="outline-btn profile-button" data-student-id="${student.id}">Profile</button> <button class="outline-btn deactivate-button" data-student-id="${student.id}">Deactivate</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No students found.</td></tr>';
      document.querySelector('#student-count').textContent = `${records.length} total records`;
      const panel = directory.closest('.panel');
      panel?.querySelector('.pagination')?.remove();
      if (page.total) panel?.insertAdjacentHTML('beforeend', paginationMarkup('students', page.page, page.totalPages, page.total, page.start));
      directory.querySelectorAll('.profile-button').forEach(button => button.addEventListener('click', () => loadStudentHistory(button.dataset.studentId)));
      directory.querySelectorAll('.deactivate-button').forEach(button => button.addEventListener('click', async () => { if (!confirm('Deactivate this student? Academic history will be preserved.')) return; await apiRequest(`/api/admin/students/${button.dataset.studentId}`, { method: 'DELETE' }); const refreshed = await apiRequest('/api/admin/students'); listPages.students = 1; renderRows(refreshed.students); }));
      if (panel) bindPagination(panel, 'students', () => renderRows(records));
    };
    renderRows(response.students);
    document.querySelector('#student-search').addEventListener('input', event => {
      listPages.students = 1;
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
    panel.innerHTML = `<div class="panel-header"><div><h2 class="panel-title">${escapeHtml(profile.full_name)} ? Performance history</h2><p class="panel-note">Historical results across sequences and academic years</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Academic year</th><th>Sequence</th><th>Class</th><th>Average</th><th>Grade</th><th>Subjects</th><th>Trend</th></tr></thead><tbody>${history.map(item => `<tr><td>${escapeHtml(item.academic_year)}</td><td>${escapeHtml(item.sequence)}</td><td>${escapeHtml(item.class_name)}</td><td class="student-name">${item.average_percentage}%</td><td>${escapeHtml(item.grade || '?')} ? ${escapeHtml(item.evaluation)}</td><td>${item.subjects} <span style="color:var(--positive)">+${item.passed}</span> <span style="color:var(--danger)">-${item.failed}</span></td><td style="color:${item.trend === 'improving' ? 'var(--positive)' : item.trend === 'declining' ? 'var(--danger)' : 'var(--muted)'}">${escapeHtml(item.trend)}${item.delta === null ? '' : ` (${item.delta > 0 ? '+' : ''}${item.delta}%)`}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No results recorded yet.</td></tr>'}</tbody></table></div>`;
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
    const response = await apiRequest('/api/dashboard');
    const data = response.dashboard;

    if (data.role === 'administrator' || data.role === 'admin') {
      const counts = data.counts || {};
      const analytics = data.analytics || {};
      const classes = Array.isArray(analytics.classes) ? analytics.classes : [];

      const studentsResponse = await apiRequest('/api/admin/students');
      const studentsRows = Array.isArray(studentsResponse.students)
        ? studentsResponse.students
        : [];

      const classesResponse = await apiRequest('/api/classes');
      const classRows = Array.isArray(classesResponse.classes)
        ? classesResponse.classes
        : [];

      const studentCounts = {};

      studentsRows.forEach(student => {
        const className = student.class_name || 'Unassigned';
        studentCounts[className] = (studentCounts[className] || 0) + 1;
      });

      const classDetails = new Map(
        classRows.map(item => [String(item.name), item])
      );

      const resultsRecorded =
        Number(analytics.passing_results || 0) +
        Number(analytics.failing_results || 0);

      const totalStudents =
        document.querySelector('#admin-total-students');

      const schoolAverage =
        document.querySelector('#admin-school-average');

      const resultsRecordedElement =
        document.querySelector('#admin-results-recorded');

      const activeTeachers =
        document.querySelector('#admin-active-teachers');

      if (totalStudents) {
        totalStudents.textContent =
          Number(counts.students || 0).toLocaleString();
      }

      if (schoolAverage) {
        schoolAverage.textContent =
          `${Number(analytics.overall_average || 0).toFixed(2)}%`;
      }

      if (resultsRecordedElement) {
        resultsRecordedElement.textContent =
          resultsRecorded.toLocaleString();
      }

      if (activeTeachers) {
        activeTeachers.textContent =
          Number(counts.teachers || 0).toLocaleString();
      }

      const chart =
        document.querySelector('#admin-performance-chart');

      if (chart) {
        chart.innerHTML = classes.map((item, index) => {
          const average = Math.max(
            0,
            Math.min(100, Number(item.average) || 0)
          );

          return `
            <div class="bar-wrap">
              <div
                class="bar"
                style="height:${average * 2}px;animation-delay:${index * .06}s"
              ></div>
              <span class="bar-label">${escapeHtml(item.name)}</span>
            </div>
          `;
        }).join('') || `
          <div class="empty">
            No class results found for the current sequence.
          </div>
        `;
      }

      const classTable =
        document.querySelector('#admin-class-performance');

      if (classTable) {
        classTable.innerHTML = classes.map(item => {
          const details =
            classDetails.get(String(item.name)) || {};

          const studentCount =
            studentCounts[item.name] || 0;

          const average =
            Number(item.average || 0);

          const status =
            average >= 70
              ? 'On track'
              : 'Needs attention';

          return `
            <tr>
              <td class="student-name">
                ${escapeHtml(item.name)}
              </td>
              <td>
                ${escapeHtml(details.class_master_name || 'Unassigned')}
              </td>
              <td>${studentCount}</td>
              <td style="color:var(--text)">
                ${average.toFixed(2)}%
              </td>
              <td>
                <span class="status ${average < 70 ? 'pending' : ''}">
                  ${status}
                </span>
              </td>
            </tr>
          `;
        }).join('') || `
          <tr>
            <td colspan="5" class="empty">
              No class results found for the current sequence.
            </td>
          </tr>
        `;
      }

      return;
    }

    if (data.role === 'teacher') {
      document.querySelector('#teacher-dashboard-stats').innerHTML =
        [
          ['Assigned subjects', data.assigned_subjects],
          ['Assigned classes', data.assigned_classes],
          ['Awaiting entry', data.pending_results],
          ['Completed results', data.completed_results]
        ]
          .map(item => `
            <article class="panel stat-card">
              <div class="stat-head">
                <span>${item[0]}</span>
              </div>
              <div class="stat-value">${item[1]}</div>
            </article>
          `)
          .join('');

      document.querySelector('#teacher-assignments').innerHTML =
        data.assignments.map(item => `
          <tr>
            <td class="student-name">${item.subject_name}</td>
            <td>${item.class_name}</td>
            <td>
              <button class="outline-btn" data-view="results">
                Enter marks
              </button>
            </td>
          </tr>
        `).join('') ||
        '<tr><td colspan="3" class="empty">No assignments yet. Ask an administrator to assign subjects and classes.</td></tr>';

      document
        .querySelectorAll('#teacher-assignments [data-view]')
        .forEach(button => {
          button.addEventListener('click', () => {
            state.view = button.dataset.view;
            render();
          });
        });

    } else if (data.role === 'class_master') {
      const classes = data.classes || [];

      const average = classes.length
        ? (
            classes.reduce(
              (sum, item) =>
                sum + Number(item.performance.class_average),
              0
            ) / classes.length
          ).toFixed(2)
        : '0.00';

      const ranked = classes.reduce(
        (sum, item) =>
          sum + Number(item.performance.student_count),
        0
      );

      document.querySelector('#master-dashboard-stats').innerHTML =
        [
          ['Assigned classes', classes.length],
          ['Students', data.students],
          ['Class average', `${average}%`],
          ['Ranked students', ranked]
        ]
          .map(item => `
            <article class="panel stat-card">
              <div class="stat-head">
                <span>${item[0]}</span>
              </div>
              <div class="stat-value">${item[1]}</div>
            </article>
          `)
          .join('');

      document.querySelector('#master-classes').innerHTML =
        classes.map(item => `
          <tr>
            <td class="student-name">${item.name}</td>
            <td>${item.students}</td>
            <td>${item.performance.class_average}%</td>
            <td>${item.performance.total_passed}</td>
            <td>
              <button class="outline-btn" data-view="reports">
                Report cards
              </button>
            </td>
          </tr>
        `).join('') ||
        '<tr><td colspan="5" class="empty">No classes assigned.</td></tr>';

      document
        .querySelectorAll('#master-classes [data-view]')
        .forEach(button => {
          button.addEventListener('click', () => {
            state.view = button.dataset.view;
            render();
          });
        });
    }

  } catch (exception) {
    const target =
      document.querySelector('#teacher-dashboard-stats') ||
      document.querySelector('#master-dashboard-stats') ||
      document
        .querySelector('#admin-total-students')
        ?.closest('.stats-grid');

    if (target) {
      if (target.classList.contains('stats-grid')) {
        target.innerHTML = `
          <article class="panel">
            <div class="empty" style="color:var(--danger)">
              ${escapeHtml(exception.message)}
            </div>
          </article>
        `;
      } else {
        target.innerHTML = `
          <article class="panel">
            <div class="empty" style="color:var(--danger)">
              ${escapeHtml(exception.message)}
            </div>
          </article>
        `;
      }
    }
  }
}
async function hydrateTeacherPages() {
  if (window.location.protocol === 'file:') return;

  const view = state.view;
  if (!['teacher-classes', 'teacher-subjects'].includes(view)) return;

  try {
    const response = await apiRequest('/api/dashboard');
    const data = response.dashboard || {};
    const assignments = Array.isArray(data.assignments) ? data.assignments : [];

    if (view === 'teacher-classes') {
      const container = document.querySelector('#teacher-my-classes');
      if (!container) return;

      const rows = assignments.map(item => `
        <tr>
          <td class="student-name">${escapeHtml(item.class_name || 'Unassigned')}</td>
          <td>${escapeHtml(item.subject_name || 'Unassigned')}</td>
          <td>
            <button class="outline-btn" data-view="results">Enter marks</button>
          </td>
        </tr>
      `).join('');

      container.innerHTML = rows ||
        '<tr><td colspan="3" class="empty">No classes assigned yet. Ask an administrator to assign subjects and classes.</td></tr>';

      container.querySelectorAll('[data-view]').forEach(button => {
        button.addEventListener('click', () => {
          state.view = button.dataset.view;
          render();
        });
      });
    }

    if (view === 'teacher-subjects') {
      const container = document.querySelector('#teacher-my-subjects');
      if (!container) return;

      const rows = assignments.map(item => `
        <tr>
          <td class="student-name">${escapeHtml(item.subject_name || 'Unassigned')}</td>
          <td>${escapeHtml(item.class_name || 'Unassigned')}</td>
          <td>
            <button class="outline-btn" data-view="results">Enter marks</button>
          </td>
        </tr>
      `).join('');

      container.innerHTML = rows ||
        '<tr><td colspan="3" class="empty">No subjects assigned yet. Ask an administrator to assign subjects and classes.</td></tr>';

      container.querySelectorAll('[data-view]').forEach(button => {
        button.addEventListener('click', () => {
          state.view = button.dataset.view;
          render();
        });
      });
    }
  } catch (error) {
    const container =
      document.querySelector('#teacher-my-classes') ||
      document.querySelector('#teacher-my-subjects');

    if (container) {
      container.innerHTML =
        `<tr><td colspan="3" class="empty">${escapeHtml(error.message || 'Unable to load assignments.')}</td></tr>`;
    }
  }
}

async function hydrateTeacherProfile() {
  if (window.location.protocol === 'file:') return;

  const button = document.querySelector('#teacher-change-password');
  const message = document.querySelector('#teacher-password-message');

  if (!button || !message) return;

  button.addEventListener('click', async () => {
    const currentPassword =
      document.querySelector('#teacher-current-password')?.value || '';

    const newPassword =
      document.querySelector('#teacher-new-password')?.value || '';

    const confirmPassword =
      document.querySelector('#teacher-confirm-password')?.value || '';

    message.textContent = '';
    message.className = '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      message.textContent = 'Please fill in all password fields.';
      return;
    }

    if (newPassword.length < 8) {
      message.textContent =
        'New password must be at least 8 characters.';
      return;
    }

    if (newPassword !== confirmPassword) {
      message.textContent = 'New passwords do not match.';
      return;
    }

    button.disabled = true;
    button.textContent = 'Changing...';

    try {
      const response = await apiRequest('/api/me/password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      message.textContent =
        response.message || 'Password changed successfully.';

      document.querySelector('#teacher-current-password').value = '';
      document.querySelector('#teacher-new-password').value = '';
      document.querySelector('#teacher-confirm-password').value = '';

    } catch (error) {
      message.textContent =
        error.message || 'Unable to change password.';
    } finally {
      button.disabled = false;
      button.textContent = 'Change Password';
    }
  });
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
    administrators: administratorsPage,
    classes: classesPage,
    subjects: subjectsPage,
    reports: reportsPage,
    analytics: analyticsPage,
    assignments: assignmentsPage,
    settings: settingsPage,
    'teacher-classes': teacherClassesPage,
    'teacher-subjects': teacherSubjectsPage,
    'teacher-profile': teacherProfilePage
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

const sidebar = document.querySelector('#main-sidebar');
const menuToggle = document.querySelector('#mobile-menu-toggle');

if (sidebar && menuToggle) {
  menuToggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('mobile-menu-open');

    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute(
      'aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu'
    );
  });
}

  const logoutButton = document.querySelector('#logout-button');

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    logoutButton.querySelector('span').textContent = 'Logging out...';

    try {
      await apiRequest('/api/logout', {
        method: 'POST'
      });

      state.user = null;
      state.csrf = null;
      state.loggedIn = false;
      state.registering = false;
      state.view = 'dashboard';
      render();
    } catch (error) {
      logoutButton.disabled = false;
      logoutButton.querySelector('span').textContent = 'Logout';
      alert(error.message || 'Unable to log out.');
    }
  });
}

  switch (state.view) {
    case 'dashboard':
      hydrateRoleDashboard();
      break;
    case 'results':
      hydrateResultEntry();
      break;
    case 'teacher-classes':
case 'teacher-subjects':
  hydrateTeacherPages();
  break;

case 'teacher-profile':
  hydrateTeacherProfile();
  break;
    case 'students':
      hydrateStudents();
      break;
    case 'teachers':
      hydrateTeachers();
      break;
    case 'administrators':
  hydrateAdministrators();
  break;
    case 'classes':
      hydrateClasses();
      break;
    case 'subjects':
  hydrateSubjects();
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

async function bootstrapSession() {
  if (window.location.protocol === 'file:') {
    render();
    return;
  }

  try {
    const result = await apiRequest('/api/me');
    state.user = result.user;
    state.csrf = result.csrf;
    state.loggedIn = true;
  } catch (error) {
    state.user = null;
    state.csrf = null;
    state.loggedIn = false;
  }

  render();
}

bootstrapSession();

