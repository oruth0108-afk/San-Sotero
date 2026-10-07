<?php

return [
    'name'           => env('BARANGAY_NAME', 'San Sotero'),
    'municipality'   => env('BARANGAY_MUNICIPALITY', 'Municipality / City'),
    'province'       => env('BARANGAY_PROVINCE', 'Province'),
    'address'        => env('BARANGAY_ADDRESS', 'Barangay Hall, San Sotero'),
    'contact'        => env('BARANGAY_CONTACT', ''),
    'captain_name'   => env('BARANGAY_CAPTAIN', 'Hon. Punong Barangay'),
    'secretary_name' => env('BARANGAY_SECRETARY', 'Barangay Secretary'),
    'validity_months' => 6,
    'frontend_url'   => env('FRONTEND_URL', 'http://localhost:5173'),

    'civil_statuses' => ['Single', 'Widowed', 'Married', 'Divorced / Annulled', 'Separated'],
    'purposes' => ['Employment', 'School', 'Scholarship', 'Financial Assistance', 'Medical Assistance',
        'Travel', 'Business', 'Legal', 'Government Transaction', 'Others'],

    // Optional notification hooks (in-app notifications are always created)
    'notify_email' => env('NOTIFY_EMAIL', false),
    'sms' => [
        'enabled' => env('SMS_ENABLED', false),
        'url'     => env('SMS_API_URL'),
        'key'     => env('SMS_API_KEY'),
        'sender'  => env('SMS_SENDER', 'SanSotero'),
    ],

    // Default password used by seeders only. Change immediately after first login.
    'seed_password' => env('SEED_PASSWORD', 'Password@123'),
];
