# Mabanda Migration Audit

## Reference examined

Source archive: the uploaded `mabanda` PHP project.

The application tree contains 386 files in the extracted project, including 245 PHP files, 6 SQL files, the original frontend, assets, generated legacy reports, and the bundled Dompdf/vendor libraries. The migration used the application PHP classes, public router, frontend, schema, demo seed, migrations, and logo as the authoritative behavior.

## PHP route surface migrated

- `/api/login`
- `/api/register/teacher`
- `/api/logout`
- `/api/me`
- `/api/dashboard`
- `/api/results` GET/POST
- `/api/results/submit`
- `/api/admin/results/:id/approve|lock|unlock`
- `/api/students`
- `/api/admin/students` GET/POST
- `/api/admin/students/:id` DELETE
- `/api/admin/students/:id/history`
- `/api/performance`
- `/api/admin/analytics`
- `/api/admin/reports`
- `/api/admin/submitted-reports`
- `/api/admin/subject-performance`
- `/api/report-cards`
- `/api/report-cards/bulk`
- `/api/admin/classes` POST
- `/api/admin/classes/:id` PUT/DELETE
- `/api/admin/classes/:id/classlist`
- `/api/admin/subjects` POST
- `/api/admin/assignments` GET/POST
- `/api/admin/assignments/:id` PUT/DELETE
- `/api/admin/teachers` GET/POST
- `/api/admin/teachers/:id` DELETE
- `/api/admin/class-masters`
- `/api/admin/settings` GET/PUT
- `/api/admin/grading` GET/POST
- `/api/admin/audit`
- `/api/classes`
- `/api/subjects`
- `/api/academic-years`
- `/api/terms`
- `/api/sequences`
- `/api/results/finalized`
- `/api/results/finalize`
- `/api/results/reopen`

## Database

The MySQL schema was converted to PostgreSQL types, constraints, foreign keys, indexes, enum/check semantics, serial/bigserial keys, and timestamp update triggers. MySQL-only database operations in runtime code were replaced by PostgreSQL parameterized queries.

The seed avoids relying on the original numeric IDs for demo users/classes/subjects/students; it resolves records by email, code, name, or student identifier. The result generator uses the same demo formula from the supplied SQL.

## Calculations preserved

The supplied PHP calculation behavior was ported, including:

- percentage = mark / max_mark * 100
- coefficient-weighted averages
- two-decimal rounding at the same calculation points
- 40% pass threshold
- grading-scale lookup by highest qualifying minimum percentage
- competition-style ranking in `classSummary`
- history delta/trend calculation
- analytics pass-rate and average calculations
- annual report-card term averaging and coefficient weighting

## Report cards

The active PHP path is `ReportCards::generate()` -> `generateAnnual()`. The unreachable legacy single-sequence renderer below that return statement was not made the active Node implementation because it is unreachable in the supplied application.

The Node implementation retains the annual report-card structure, CSS, watermark, original school logo, assessment-calendar columns, term averages, annual average, grade/evaluation, class average, position, remarks, signatures, Letter portrait output, and bulk ZIP behavior.

## Frontend fidelity

`public/index.html`, `public/styles.css`, and the supplied school logo are byte-for-byte identical to the supplied originals.

`public/app.js` is retained with only two migration-required edits:

1. API base changes from the PHP `/mabanda/public` location to the Node application's origin.
2. An unused generic placeholder sentence was changed so the migrated runtime project contains no PHP/MySQL API dependency reference.

No visual layout, colors, fonts, navigation labels, form structure, report-card HTML/CSS, logo, or workflow copy was redesigned.

## Known source behaviors intentionally retained

- The supplied `updateAssignment()` method performs validation and writes an audit entry but does not execute an UPDATE. The Node route mirrors that source behavior rather than silently changing the application's behavior.
- The report-card API accepts term/sequence values, but the supplied active implementation generates the annual report card regardless of those values. The Node route follows the active implementation.
- Several frontend screens contain legacy/demo presentation text before their API hydration; the Node application retains the supplied frontend rather than replacing it with a redesign.

## Validation performed

- Node syntax checks passed for `server.js`, database scripts, and the static migration check.
- Static route coverage check passed.
- Runtime source scan found no MySQL/PHP database driver constructs.
- Original frontend CSS, HTML, and logo were compared against the supplied source.
- A live Neon database test was not possible because no `DATABASE_URL` was supplied in the request. `npm install` was attempted in the build environment but timed out before dependencies were installed, so live DB/PDF execution was not falsely reported as completed.
