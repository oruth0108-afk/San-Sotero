#!/usr/bin/env bash
# One-shot setup: builds backend/ from a fresh Laravel install + backend-overlay/, then installs the frontend.
# Requires: PHP 8.2+, Composer 2, Node 18+, MySQL 8 (or MariaDB 10.6+).
set -euo pipefail
cd "$(dirname "$0")"

command -v composer >/dev/null || { echo "Composer is required: https://getcomposer.org"; exit 1; }
command -v npm >/dev/null || { echo "Node.js/npm is required: https://nodejs.org"; exit 1; }

if [ ! -d backend ]; then
  composer create-project laravel/laravel backend --prefer-dist --no-interaction
fi

cd backend
php artisan install:api --without-migration-prompt --no-interaction   # Sanctum + routes/api.php
composer require barryvdh/laravel-dompdf --no-interaction

# Copy our code on top of the fresh app (overwrites bootstrap/app.php and routes/api.php on purpose)
cp -R ../backend-overlay/. .

# Point Laravel at MySQL and add the barangay settings
sed -i.bak \
  -e 's/^DB_CONNECTION=.*/DB_CONNECTION=mysql/' \
  -e 's/^# *DB_HOST=.*/DB_HOST=127.0.0.1/' \
  -e 's/^# *DB_PORT=.*/DB_PORT=3306/' \
  -e 's/^# *DB_DATABASE=.*/DB_DATABASE=san_sotero/' \
  -e 's/^# *DB_USERNAME=.*/DB_USERNAME=root/' \
  -e 's/^# *DB_PASSWORD=.*/DB_PASSWORD=/' .env && rm -f .env.bak

if ! grep -q "BARANGAY_NAME" .env; then
cat >> .env <<'ENVBLOCK'

# --- San Sotero settings ---
FRONTEND_URL=http://localhost:5173
BARANGAY_NAME="San Sotero"
BARANGAY_MUNICIPALITY="Your Municipality / City"
BARANGAY_PROVINCE="Your Province"
BARANGAY_ADDRESS="Barangay Hall, San Sotero"
BARANGAY_CONTACT=""
BARANGAY_CAPTAIN="Hon. Punong Barangay Name"
BARANGAY_SECRETARY="Barangay Secretary Name"
NOTIFY_EMAIL=false
SMS_ENABLED=false
SMS_API_URL=
SMS_API_KEY=
SMS_SENDER=SanSotero
SEED_PASSWORD="Password@123"
ENVBLOCK
fi

cd ../frontend
[ -f .env ] || cp .env.example .env
npm install

cat <<'DONE'

Setup finished. Next steps:
  1. Create an empty MySQL database named  san_sotero  (utf8mb4).
  2. Check DB_USERNAME / DB_PASSWORD and the BARANGAY_* values in backend/.env
  3. cd backend && php artisan migrate --seed
  4. Terminal A:  cd backend  && php artisan serve        (http://localhost:8000)
     Terminal B:  cd frontend && npm run dev              (http://localhost:5173)
DONE
