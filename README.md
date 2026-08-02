# Kaldi's Procurement — Laravel + React

A Supplier Data & Proforma Request System ported from Next.js to **Laravel 12 + React 19 (Inertia.js)** with role-based access control and Telegram bot integration.

## Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+), SQLite (default) / MySQL / PostgreSQL
- **Frontend**: React 19 + Inertia.js + Vite 7 + Tailwind CSS 4
- **Auth**: Laravel session-based auth with custom role-permission RBAC (4 roles, 16 permissions)
- **Charts**: Recharts
- **Icons**: Lucide React

## Requirements

- PHP >= 8.2 (with extensions: pdo, pdo_sqlite/sqlite3, mbstring, xml, tokenizer, ctype, fileinfo, curl, dom, openssl, json, session)
- Composer 2+
- Node.js 18+ and npm
- SQLite (default) or MySQL/PostgreSQL

## Installation

```bash
# 1. Install PHP dependencies
composer install

# 2. Install JS dependencies
npm install --legacy-peer-deps

# 3. Configure environment
cp .env.example .env
php artisan key:generate

# 4. Configure database in .env (SQLite is default)
# For SQLite: ensure database/database.sqlite exists (touch it if not)
# For MySQL: update DB_CONNECTION=mysql, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 5. Run migrations + seed
php artisan migrate:fresh --seed

# 6. Build frontend assets
npm run build
# (or for dev: npm run dev)

# 7. Start the server
php artisan serve
```

Visit http://localhost:8000

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@kaldisbunna.et | admin123 |
| Purchase Manager | selam@kaldisbunna.et | purchaser123 |
| Finance Officer | finance@kaldisbunna.et | finance123 |
| Proforma Requester | requester@kaldisbunna.et | requester123 |

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| **admin** | All 16 permissions (full access + user management) |
| **purchaser** (Purchase Manager) | Dashboard, Suppliers (view+manage), Requests (view+create+send/approve+manage), Proformas (view+review), Notifications, Audit |
| **finance** | Dashboard, Proformas (view+review), Notifications, Audit |
| **requester** (Proforma Requester) | Dashboard, Suppliers (view), Requests (view+create), Notifications |

## Features

- **Dashboard** — KPIs, charts, recent activity
- **Suppliers** — CRUD, verification workflow, search/filter
- **Proforma Requests** — Multi-step form, item lines, multi-supplier, Telegram notification
- **Proformas** — Receive, review, accept/reject, side-by-side comparison, simulate (demo mode)
- **Notifications** — In-app bell + dropdown
- **Audit Log** — Append-only record of all actions
- **Telegram Outbox** — Log of all messages sent to suppliers (simulated if no bot token)
- **Users & Roles** — Admin-only user management with self-protection
- **Settings** — Telegram bot status & setup guide

## Telegram Bot Integration

Set `TELEGRAM_BOT_TOKEN` in `.env` to enable real Telegram notifications. Without it, the system runs in "demo mode" — notifications are logged to the Telegram Outbox as "simulated" and admins can simulate supplier proforma responses via the UI.

A separate Telegram bot polling service (Node.js/Bun) can be found in the original Next.js project at `mini-services/telegram-bot/`. To use it with this Laravel app, point it at the same database.

## Deployment

```bash
composer run deploy
```

Runs, in order: `composer install --no-dev --optimize-autoloader`, `npm ci && npm run build`, `migrate --force`, then caches config/routes/views/events.

Before running it on a real server:

- Set `APP_ENV=production` and `APP_DEBUG=false` in `.env` (this repo's `.env` is currently set for local development — don't ship it as-is).
- Set `APP_URL` to the real public URL (used to build the Telegram webhook URL).
- Point the web server's document root at `public/`, not the repo root.
- Run a persistent queue worker (`php artisan queue:work --tries=3`, under Supervisor/systemd) — proforma-request Telegram notifications are dispatched as queued jobs, so without a worker running they'll sit in the `jobs` table and never send.
- Re-run `php artisan config:cache` (or `composer run deploy` again) after any subsequent `.env` change — cached config ignores further edits until cleared.

## API Endpoints

All under `/api/*` (session-authenticated):

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/dashboard`
- `GET/POST /api/suppliers`, `GET/PUT/DELETE /api/suppliers/{id}`, `POST /api/suppliers/{id}/verify`
- `GET/POST /api/proforma-requests`, `GET/PATCH/DELETE /api/proforma-requests/{id}`, `POST /api/proforma-requests/{id}/send`
- `GET /api/proformas`, `GET/PATCH /api/proformas/{id}`, `POST /api/proformas/simulate`
- `GET /api/notifications`, `PATCH /api/notifications`, `PATCH /api/notifications/{id}`
- `GET /api/audit-logs`
- `GET /api/telegram-outbox`
- `GET /api/telegram-status`
- `GET/POST /api/users`, `PATCH/DELETE /api/users/{id}`
- `GET /api/categories`
- `POST /api/seed` (idempotent — safe to call anytime)

## Project Structure

```
├── app/
│   ├── Enums/           # UserRole, Permission enums
│   ├── Http/
│   │   ├── Controllers/Api/  # API controllers
│   │   ├── Middleware/       # RequirePermission, HandleInertiaRequests
│   │   └── Requests/         # Form Request validation
│   ├── Models/          # Eloquent models
│   └── Services/        # RoleService, AuditService, TelegramService, etc.
├── database/
│   ├── migrations/      # 11 migration files
│   └── seeders/         # DatabaseSeeder
├── resources/js/
│   ├── Components/      # React view components + ui/ primitives
│   ├── Pages/           # Inertia pages (App.jsx)
│   ├── hooks/           # use-toast
│   └── lib/             # procurement.js (types+helpers), utils.js
├── routes/web.php       # All routes (API + Inertia catch-all)
└── bootstrap/app.php    # Middleware + exception handlers
```

## License

MIT
# kaldis_procrument
