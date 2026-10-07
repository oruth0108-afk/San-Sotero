# API reference

Base URL: `/api`. JSON in/out. Authenticated routes need `Authorization: Bearer <token>`. Validation errors return `422` with `{ "message", "errors": { field: [..] } }`. Lists are paginated Laravel-style (`data`, `current_page`, `last_page`, `total`).

## Public

| Method | Path | Notes |
|---|---|---|
| GET | `/meta` | Barangay name, purposes, civil statuses |
| POST | `/auth/register` | `multipart/form-data`: name, email, password, password_confirmation, purok, address, birthdate, civil_status, contact_number, valid_id_type, valid_id (file). Returns `{user, token}`. Throttled |
| POST | `/auth/login` | `{email, password}` -> `{user, token}`. Throttled (6/min) |

## Any signed-in user

| Method | Path | Notes |
|---|---|---|
| GET | `/auth/me` | Current user |
| POST | `/auth/logout` | Revokes the current token |
| GET | `/document-types` | Active types. Staff may add `?all=1` |
| POST | `/profile` | Update profile (multipart; optional `valid_id`) |
| PUT | `/profile/password` | `current_password, password, password_confirmation` |
| GET | `/notifications` | Latest 50 + `unread_count` |
| GET | `/notifications/unread-count` | |
| POST | `/notifications/{id}/read` | |
| POST | `/notifications/read-all` | |
| GET | `/attachments/{id}` | Streams a file; owner or staff only |

## Resident (`role:resident`)

| Method | Path | Notes |
|---|---|---|
| GET | `/requests` | Own requests. Filters: `status`, `q`, `page`, `per_page` |
| GET | `/requests/summary` | Counts per status |
| POST | `/requests` | `multipart`: document_type_id, purpose, purpose_details, `attachments[i]` for each required attachment `i` of the document type. Account must be verified |
| GET | `/requests/{id}` | Details, attachments, history |

## Staff (`role:admin,staff,captain`) - prefix `/admin`

| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard` | Totals, counts by status and type, monthly trend, recent requests |
| GET | `/requests` | Filters: `status`, `document_type_id`, `from`, `to`, `q`, `page`, `per_page` |
| GET | `/requests/{id}` | Full details including resident |
| PATCH | `/requests/{id}/status` | `{status, remarks?, pickup_date?, is_paid?, or_number?}`. `rejected` needs `remarks`; `ready_for_pickup` needs `pickup_date`; `approved` needs captain/admin; releasing a document with a fee needs `is_paid` |
| GET | `/requests/{id}/pdf` | PDF (approved, ready for pickup or released only) |
| GET | `/requests-export/{csv\|pdf}` | Same filters as the list; max 2000 rows |
| GET | `/residents` | Filters: `status` (pending/verified/deactivated), `q` |
| PATCH | `/residents/{id}/status` | `{status}` |
| GET | `/residents/{id}/valid-id` | Streams the ID (logged) |

## Admin only (`role:admin`) - prefix `/admin`

| Method | Path | Notes |
|---|---|---|
| POST / PUT / DELETE | `/document-types[/{id}]` | name, description, fee, processing_days, required_attachments[], template, is_active. Types with requests cannot be deleted |
| GET / POST | `/staff` | Create `{name, email, role: staff\|captain\|admin, password}` |
| PATCH | `/staff/{id}/status` | `verified` or `deactivated` |
| GET | `/activity-logs` | Filters: `action`, `q`, `from`, `to` |
| GET | `/activity-logs/actions` | Distinct action names |

## Database

`users` (+ role, account_status, purok, address, birthdate, civil_status, contact_number, valid_id_*) - `document_types` - `document_requests` - `request_attachments` - `request_status_histories` - `user_notifications` - `activity_logs` (plus Sanctum's `personal_access_tokens`).

Relationships: user hasMany requests; request belongsTo user, documentType, reviewer/approver/releaser (users); request hasMany attachments, histories.
