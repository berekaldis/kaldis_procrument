<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProformaController;
use App\Http\Controllers\Api\ProformaRequestController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierDocumentController;
use App\Http\Controllers\Api\TelegramConfigController;
use App\Http\Controllers\Api\TelegramOutboxController;
use App\Http\Controllers\Api\TelegramStatusController;
use App\Http\Controllers\Api\TelegramWebhookController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// API routes — registered FIRST so the catch-all Inertia route below does
// not intercept them.
Route::prefix('api')->group(function () {
    // Public
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Public — hit by Telegram's servers, not the browser. Protected by a
    // secret path segment + secret header instead of session auth.
    Route::post('/telegram/webhook/{secret}', [TelegramWebhookController::class, 'receive']);

    // Authenticated
    Route::middleware('auth')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store'])
            ->middleware('permission:suppliers.manage');
        Route::patch('/categories/{id}', [CategoryController::class, 'update'])
            ->whereNumber('id')->middleware('permission:suppliers.manage');
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])
            ->whereNumber('id')->middleware('permission:suppliers.manage');

        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/password', [ProfileController::class, 'updatePassword']);

        Route::get('/search', [SearchController::class, 'index']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications', [NotificationController::class, 'updateAll']);
        Route::patch('/notifications/{id}', [NotificationController::class, 'update'])->whereNumber('id');
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->whereNumber('id');

        Route::get('/organization', [OrganizationController::class, 'show']);
        Route::patch('/organization', [OrganizationController::class, 'update'])
            ->middleware('permission:settings.manage');
        Route::post('/organization/logo', [OrganizationController::class, 'uploadLogo'])
            ->middleware('permission:settings.manage');

        // Suppliers
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::get('/suppliers/{id}', [SupplierController::class, 'show'])->whereNumber('id');
        Route::post('/suppliers', [SupplierController::class, 'store'])
            ->middleware('permission:suppliers.manage');
        Route::put('/suppliers/{id}', [SupplierController::class, 'update'])
            ->whereNumber('id')->middleware('permission:suppliers.manage');
        Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy'])
            ->whereNumber('id')->middleware('permission:suppliers.manage');
        Route::post('/suppliers/{id}/verify', [SupplierController::class, 'verify'])
            ->whereNumber('id')->middleware('permission:suppliers.verify');
        Route::post('/suppliers/bulk-action', [SupplierController::class, 'bulkAction']);
        Route::post('/suppliers/{id}/documents', [SupplierDocumentController::class, 'store'])
            ->whereNumber('id')->middleware('permission:suppliers.manage');
        Route::delete('/suppliers/{id}/documents/{documentId}', [SupplierDocumentController::class, 'destroy'])
            ->whereNumber('id')->whereNumber('documentId')->middleware('permission:suppliers.manage');

        // Proforma Requests
        Route::get('/proforma-requests', [ProformaRequestController::class, 'index']);
        Route::get('/proforma-requests/{id}', [ProformaRequestController::class, 'show'])->whereNumber('id');
        Route::post('/proforma-requests', [ProformaRequestController::class, 'store'])
            ->middleware('permission:requests.create');
        Route::patch('/proforma-requests/{id}', [ProformaRequestController::class, 'update'])
            ->whereNumber('id')->middleware('permission:requests.manage');
        Route::delete('/proforma-requests/{id}', [ProformaRequestController::class, 'destroy'])
            ->whereNumber('id')->middleware('permission:requests.manage');
        Route::post('/proforma-requests/{id}/send', [ProformaRequestController::class, 'send'])
            ->whereNumber('id')->middleware('permission:requests.send');
        Route::post('/proforma-requests/{id}/clone', [ProformaRequestController::class, 'clone'])
            ->whereNumber('id')->middleware('permission:requests.create');

        // Proformas
        Route::get('/proformas', [ProformaController::class, 'index']);
        Route::get('/proformas/{id}', [ProformaController::class, 'show'])->whereNumber('id');
        Route::patch('/proformas/{id}', [ProformaController::class, 'update'])
            ->whereNumber('id')->middleware('permission:proformas.review');
        Route::post('/proformas/manual', [ProformaController::class, 'manual'])
            ->middleware('permission:proformas.review');

        // Users (admin)
        Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.manage');
        Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.manage');
        Route::patch('/users/{id}', [UserController::class, 'update'])
            ->whereNumber('id')->middleware('permission:users.manage');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])
            ->whereNumber('id')->middleware('permission:users.manage');

        // Permission-gated GETs
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->middleware('permission:dashboard.view');
        Route::get('/audit-logs', [AuditLogController::class, 'index'])
            ->middleware('permission:audit.view');
        Route::get('/telegram-outbox', [TelegramOutboxController::class, 'index'])
            ->middleware('permission:outbox.view');
        Route::get('/telegram-status', [TelegramStatusController::class, 'index'])
            ->middleware('permission:settings.view');
        Route::post('/telegram-status/webhook', [TelegramWebhookController::class, 'register'])
            ->middleware('permission:settings.manage');
        Route::delete('/telegram-status/webhook', [TelegramWebhookController::class, 'remove'])
            ->middleware('permission:settings.manage');

        Route::get('/settings/telegram', [TelegramConfigController::class, 'index'])
            ->middleware('permission:settings.view');
        Route::patch('/settings/telegram', [TelegramConfigController::class, 'update'])
            ->middleware('permission:settings.manage');
        Route::post('/settings/telegram/generate-secret', [TelegramConfigController::class, 'generateSecret'])
            ->middleware('permission:settings.manage');

        Route::get('/permissions', [PermissionController::class, 'index'])
            ->middleware('permission:settings.manage');
        Route::patch('/permissions', [PermissionController::class, 'update'])
            ->middleware('permission:settings.manage');
    });
});

// Inertia root — single SPA shell. The React frontend (another agent) renders
// all sections client-side; the Laravel side only serves JSON.
Route::get('/', fn () => Inertia::render('App'))->name('home');
Route::get('/{any}', fn () => Inertia::render('App'))->where('any', '^(?!api).*$');
