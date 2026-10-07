<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RequestController;
use Illuminate\Support\Facades\Route;

// Public reference data for forms
Route::get('meta', fn () => response()->json([
    'barangay'       => config('barangay.name'),
    'purposes'       => config('barangay.purposes'),
    'civil_statuses' => config('barangay.civil_statuses'),
]));

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('document-types', [DocumentTypeController::class, 'index']);

    Route::post('profile', [ProfileController::class, 'update']);          // POST because it may carry a file
    Route::put('profile/password', [ProfileController::class, 'password'])->middleware('throttle:6,1');

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read']);

    Route::get('attachments/{attachment}', [AttachmentController::class, 'show']);

    // Residents
    Route::middleware('role:resident')->group(function () {
        Route::get('requests', [RequestController::class, 'index']);
        Route::get('requests/summary', [RequestController::class, 'summary']);
        Route::post('requests', [RequestController::class, 'store'])->middleware('throttle:20,1');
        Route::get('requests/{documentRequest}', [RequestController::class, 'show']);
    });

    // Barangay officials and staff
    Route::prefix('admin')->middleware('role:admin,staff,captain')->group(function () {
        Route::get('dashboard', Admin\DashboardController::class);

        Route::get('requests', [Admin\RequestController::class, 'index']);
        Route::get('requests-export/{format}', [Admin\RequestController::class, 'export'])->whereIn('format', ['csv', 'pdf']);
        Route::get('requests/{documentRequest}', [Admin\RequestController::class, 'show']);
        Route::patch('requests/{documentRequest}/status', [Admin\RequestController::class, 'updateStatus']);
        Route::get('requests/{documentRequest}/pdf', [Admin\RequestController::class, 'pdf']);

        Route::get('residents', [Admin\ResidentController::class, 'index']);
        Route::patch('residents/{user}/status', [Admin\ResidentController::class, 'updateStatus']);
        Route::get('residents/{user}/valid-id', [Admin\ResidentController::class, 'validId']);

        // Admin / Barangay Secretary only
        Route::middleware('role:admin')->group(function () {
            Route::post('document-types', [DocumentTypeController::class, 'store']);
            Route::put('document-types/{documentType}', [DocumentTypeController::class, 'update']);
            Route::delete('document-types/{documentType}', [DocumentTypeController::class, 'destroy']);

            Route::get('staff', [Admin\StaffController::class, 'index']);
            Route::post('staff', [Admin\StaffController::class, 'store']);
            Route::patch('staff/{user}/status', [Admin\StaffController::class, 'updateStatus']);

            Route::get('activity-logs', [Admin\ActivityLogController::class, 'index']);
            Route::get('activity-logs/actions', [Admin\ActivityLogController::class, 'actions']);
        });
    });
});
