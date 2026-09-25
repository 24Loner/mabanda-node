# Mabanda — Node.js + PostgreSQL / Neon

This project is a **technical migration of the supplied Mabanda PHP + MySQL application**. The supplied PHP source remains the reference/legacy copy and was not modified.

## What was inspected

The migration was based on the uploaded project itself, including:

- 245 PHP files in the application/vendor tree, with the application classes and public router inspected directly.
- `app/Auth.php`, `app/Academic.php`, `app/Calculations.php`, `app/Results.php`, `app/Analytics.php`, `app/Dashboard.php`, `app/ReportCards.php`, `app/Http.php`, `app/Database.php`.
- `public/index.php` and the complete `app.js` / `styles.css` frontend.
- `database/schema.sql`, `database/demo.sql`, and migrations `002`–`005`.
- The original school logo asset.
- The original PDF implementation, including the annual report-card calculation and HTML/CSS layout.

## Run

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Put the Neon connection string in `DATABASE_URL`.
4. Set a strong `SESSION_SECRET`.
5. Run:

```bash
npm install
npm run db:setup
npm start
```

Open `http://localhost:3000/`.

Demo accounts from the supplied seed use password `password`:

- `admin@mabanda.edu`
- `john@mabanda.edu`
- `mary@mabanda.edu`

The seed also includes the larger demo teaching dataset from the original `database/demo.sql`.

## Neon

Use a Neon connection string such as:

`postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`

Credentials are read only from `DATABASE_URL`; none are hard-coded into the application.

## Architecture

- `server.js` — Express application and API/backend logic.
- `public/` — original Mabanda frontend copied from the supplied project, with only the API base changed from the PHP `/mabanda/public` path to the Node origin.
- `database/schema.postgresql.sql` — PostgreSQL schema.
- `database/seed.sql` — lookup-based PostgreSQL seed/demo data.
- `database/migrations/` — PostgreSQL equivalents corresponding to the supplied MySQL migrations.
- `storage/reports/` — generated PDFs/ZIPs.
- `storage/uploads/` — reserved for application uploads.

## Fidelity notes

The frontend is intentionally not redesigned. The supplied HTML, CSS, JavaScript, branding, navigation labels, forms, workflows, and client-side behavior are retained.

The backend preserves the supplied route surface and business logic, including role checks, CSRF protection, result finalization/reopening, calculation formulas, competition ranking behavior in `classSummary`, analytics, audit records, class-list export, annual report-card generation, and bulk ZIP generation.

The annual report-card implementation follows the supplied PHP `ReportCards::generateAnnual()` structure and styling, including the school logo, watermark, assessment calendar, term/sequence columns, averages, grade/evaluation, remarks, signatures, Letter portrait output, and original filenames.

## Validation

A static migration check is included at `tests/static-migration-check.js`. It checks that the Node source contains no runtime MySQL/PHP database dependencies and that all PHP API route families have Node equivalents.

For a live database check, set `DATABASE_URL` and run:

```bash
node tests/static-migration-check.js
node -e "require('./server')"
```

The server also exposes `GET /health` for a PostgreSQL connectivity check.
