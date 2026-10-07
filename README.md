# San Sotero Online Barangay Document Request System

Residents of Barangay San Sotero request barangay documents online, upload their requirements and follow the status of each request. Barangay staff review, approve and release requests, and keep records organized.

**Stack:** Laravel 11/12 (REST API, Sanctum, Eloquent, Form Requests, Policies) - React 18 + React Router + Axios + Tailwind CSS - MySQL

## How the project is organized

```
san-sotero/
  setup.sh              builds backend/ and installs the frontend
  backend-overlay/      our Laravel code, copied on top of a fresh Laravel install
    app/Http/Controllers  Auth, Profile, Request (resident), DocumentType, Notification, Attachment, Admin/*
    app/Http/Middleware   EnsureRole, EnsureAccountActive, SecurityHeaders
    app/Http/Requests     validation (register, request, status, document type, staff, profile)
    app/Models            User, DocumentType, DocumentRequest, RequestAttachment, RequestStatusHistory, UserNotification, ActivityLog
    app/Policies          DocumentRequestPolicy
    app/Services          ActivityLogger, Notifier (in-app + optional email/SMS)
    bootstrap/app.php     middleware aliases, JSON errors
    config/               barangay.php (barangay details), cors.php
    database/             migrations + seeders
    resources/views/pdf   certificate.blade.php, requests.blade.php
    routes/api.php
  frontend/             React app (Vite)
  docs/API.md           endpoint reference
```

The overlay approach keeps this repo small and lets Composer install the exact Laravel version you have PHP for.

## Requirements

PHP 8.2+ (extensions: mbstring, xml, fileinfo, gd, pdo_mysql), Composer 2, Node 18+, MySQL 8 or MariaDB 10.6+.

## Setup

**Quick way (macOS, Linux, or Git Bash on Windows):**

```bash
./setup.sh
```

**Manual way:**

```bash
composer create-project laravel/laravel backend
cd backend
php artisan install:api --without-migration-prompt
composer require barryvdh/laravel-dompdf
cp -R ../backend-overlay/. .            # Windows: xcopy ..\backend-overlay . /E /Y
```

Then:

1. Create a database: `CREATE DATABASE san_sotero CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. In `backend/.env` set the database and barangay values:

   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=san_sotero
   DB_USERNAME=root
   DB_PASSWORD=

   FRONTEND_URL=http://localhost:5173
   BARANGAY_NAME="San Sotero"
   BARANGAY_MUNICIPALITY="Your Municipality / City"
   BARANGAY_PROVINCE="Your Province"
   BARANGAY_CAPTAIN="Hon. Punong Barangay Name"
   BARANGAY_SECRETARY="Barangay Secretary Name"
   ```

   These values appear on every printed document. `setup.sh` adds them for you with placeholders.
3. Migrate and seed: `cd backend && php artisan migrate --seed`
4. Run both servers:

   ```bash
   cd backend  && php artisan serve     # API  -> http://localhost:8000
   cd frontend && npm install && npm run dev   # App  -> http://localhost:5173
   ```

   In development Vite proxies `/api` to Laravel, so no CORS setup is needed.

## Default accounts (from the seeders)

| Role | Email | Password |
|---|---|---|
| Admin / Barangay Secretary | admin@sansotero.test | Password@123 |
| Barangay Staff | staff@sansotero.test | Password@123 |
| Barangay Captain | captain@sansotero.test | Password@123 |
| Resident (sample, verified) | resident@sansotero.test | Password@123 |

**Change these passwords before the system goes live** (or set `SEED_PASSWORD` before seeding, then delete the sample resident).

## User roles

| Capability | Resident | Staff | Captain | Admin / Secretary |
|---|:-:|:-:|:-:|:-:|
| Register, edit profile, submit requests (after verification) | yes | | | |
| View own requests, history and notifications | yes | | | |
| View all requests, residents and attachments | | yes | yes | yes |
| Start review, reject, mark ready for pickup, release | | yes | yes | yes |
| **Approve** a request | | | yes | yes |
| Verify / deactivate resident accounts | | yes | yes | yes |
| Generate PDF, export CSV/PDF | | yes | yes | yes |
| Manage document types, fees, required attachments | | | | yes |
| Create staff accounts | | | | yes |
| View activity logs | | | | yes |

## Request workflow

```
Pending -> Under review -> Approved -> Ready for pickup -> Released
   \            \
    +------------+--> Rejected (a reason is required)
```

Only these moves are allowed; the server enforces them. Staff start the review, the Captain (or Admin) approves, staff set a pickup date and finally mark the request as released (confirming fee payment when the document has a fee). Every change is saved in the request history, notifies the resident, and is written to the activity log. Reference numbers look like `SS-2026-000123`.

## Printed documents

`GET /api/admin/requests/{id}/pdf` renders `resources/views/pdf/certificate.blade.php` with the barangay header, the Captain's name as signatory, the reference number, issue date and validity (6 months, `config/barangay.php`). Each document type picks a layout through its `template` field (clearance, residency, indigency, good moral, business, barangay ID, general). **Have the barangay secretary review the certificate wording** and edit the Blade file to match your official templates.

## Security measures

- Passwords hashed (bcrypt via the `hashed` cast); strength rules on registration and password change.
- Sanctum bearer tokens that expire after 12 hours; deactivating an account revokes its tokens, and a password change signs out other devices. Because the API uses bearer tokens (not cookies), it is not exposed to CSRF; CORS only allows `FRONTEND_URL`.
- Role middleware plus a policy on requests; residents can only read their own requests (queries are scoped to the signed-in user).
- Uploads are validated (JPG/PNG/PDF, 4 MB), stored with random names on the **private** disk (`storage/app/private`) and only streamed through authorized endpoints. Staff views of a resident's ID are logged.
- Form Requests validate all input and strip HTML tags from free text; React escapes output and Blade escapes PDF output.
- Login and registration are rate limited; `role` and `account_status` are not mass-assignable; CSV export neutralizes spreadsheet formulas.
- Security headers on every API response.
- Mass-assignment, SQL injection (Eloquent bindings, escaped LIKE searches) and personal data exposure (hidden file paths, staff names hidden from residents) have been considered throughout.

For production also: serve over HTTPS, set `APP_DEBUG=false`, back up the database **and** `storage/app/private`, and consider moving the token from `localStorage` to an HttpOnly cookie (Sanctum SPA mode) if the system will be used on shared computers.

## Notifications

In-app notifications are always created (with a bell counter that refreshes every 30 s; request pages refresh every 15-20 s). Optional hooks live in `app/Services/Notifier.php`:

- **Email:** set `NOTIFY_EMAIL=true` and configure `MAIL_*` in `.env`.
- **SMS:** set `SMS_ENABLED=true`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER`. The payload is shaped for Semaphore (PH); adjust `Notifier::sms()` for another gateway.

For busier barangays, move email/SMS sending to a queue.

## Production build

```bash
cd frontend
# set VITE_API_URL=https://your-domain/api in .env if the API is on another domain
npm run build            # output in frontend/dist
```

Serve `frontend/dist` as static files (with a fallback to `index.html` for React Router) and point the web server's PHP handler at `backend/public`. Set `FRONTEND_URL` in the backend `.env` to the real site address.

## Notes and limits

- Fees are recorded and confirmed at release; there is no online payment.
- Only one print layout per document type is bundled; edit the Blade template to match your official forms.
- Add automated tests (Pest/PHPUnit) for the workflow transitions before relying on the system in production.
