<?php

use App\Http\Controllers\SmtpController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\Admin\LoginController;
use App\Http\Controllers\Admin\UserApiController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\DataActivity\DataActivityController;
use App\Http\Controllers\DataActivity\DataActivityTypeController;
use App\Http\Controllers\Instruktur\LoginInstrukturController;
use App\Http\Controllers\Instruktur\InstrukturManagementController;
use App\Http\Controllers\Sertifikat\SertifikatTemplateController;
use App\Http\Controllers\Sertifikat\SertifikatPesertaController;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\User\LoginUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Global OPTIONS preflight responder (fallback)
// This ensures browsers receive CORS headers even if HandleCors middleware is not applied.
Route::options('{any}', function (Request $request) {
    $allowed = config('cors.allowed_origins', ['*']);
    $origin = $request->headers->get('Origin');
    $allowOrigin = '*';
    if ($origin && is_array($allowed) && in_array($origin, $allowed)) {
        $allowOrigin = $origin;
    }

    $headers = [
        'Access-Control-Allow-Origin' => $allowOrigin,
        'Access-Control-Allow-Methods' => implode(', ', config('cors.allowed_methods', ['GET','POST','PUT','DELETE','OPTIONS'])),
        'Access-Control-Allow-Headers' => implode(', ', config('cors.allowed_headers', ['*'])),
    ];

    if (config('cors.supports_credentials')) {
        $headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return response()->json([], 204)->withHeaders($headers);
})->where('any', '.*');

// --- DATA ACTIVITY ROUTES ---
// Route spesifik harus selalu berada di atas route resource atau route dinamis.
Route::put('data-activities/{id}/sertifikat-template', [DataActivityController::class, 'updateSertifikatTemplate']);
Route::get('data-activities/certificate-templates', [DataActivityController::class, 'getCertificateTemplates'])->middleware('auth:sanctum');
Route::post('data-activities/{id}/import', [UserController::class, 'import'])->middleware('auth:sanctum');
Route::post('data-activities/{id}/users', [UserController::class, 'inputUserDataActivity'])->middleware('auth:sanctum');
Route::post('data-activities/{id}/set-template', [DataActivityController::class, 'setCertificateTemplate']);

// DataActivity Template Routes
Route::prefix('data-activities')->group(function () {
    Route::prefix('{activityId}/templates')->group(function () {
        Route::post('attach', [DataActivityController::class, 'attachTemplates']);
        Route::get('list', [DataActivityController::class, 'listTemplates']);
        Route::get('pending', [DataActivityController::class, 'getPendingTemplates']);
        Route::post('approve', [DataActivityController::class, 'approveTemplate']);
    });
});
// Route::resource menangani index, store, show, update, destroy secara otomatis.
Route::resource('data-activities', DataActivityController::class)->middleware('auth:sanctum');
Route::resource('data-activity-types', DataActivityTypeController::class)->middleware('auth:sanctum');

Route::put('users/reset-password', [\App\Http\Controllers\User\LoginUserController::class, 'resetPassword']);

// Protected: auth helpers and user-specific endpoints
Route::middleware('auth:sanctum')->group(function () {
    // Return authenticated user (frontend GET /auth/me)
    Route::get('auth/me', function (Illuminate\Http\Request $request) {
        return response()->json($request->user());
    });

    // Force-change password for logged in user (frontend POST /me/password)
    Route::post('me/password', [\App\Http\Controllers\Auth\ChangePasswordController::class, '__invoke']);

    // User certificates list used by dashboard frontend GET /users/myCertificates
    Route::get('users/myCertificates', [\App\Http\Controllers\User\DashboardController::class, 'myCertificates'])->name('users.my-certificates');
});

// --- USER & CERTIFICATE ROUTES ---
// Batch remove selected users (peserta/panitia/narasumber) from an activity
Route::post('data-activities/remove-participants', [SertifikatPesertaController::class, 'removeParticipants'])->middleware('auth:sanctum');
// Single remove endpoint kept for backward compatibility (DELETE /data-activities/{activity}/users/{user})
Route::delete('data-activities/{activity}/users/{user}', [SertifikatPesertaController::class, 'removeParticipant'])->middleware('auth:sanctum');
Route::post('users/login', [LoginUserController::class, 'login']);
Route::post('users/logout', [LoginUserController::class, 'logout'])->middleware('auth:sanctum');
Route::get('users/dashboard', [DashboardController::class, 'index'])->middleware('auth:sanctum');
Route::get('users/download-template', [UserController::class, 'downloadTemplate'])->name('users.downloadTemplate');
Route::resource('users', UserController::class)->middleware('auth:sanctum');

// --- ADMIN & INSTRUKTUR AUTH & MANAGEMENT ---
Route::post('roles', [RoleController::class, 'store']);

// Instruktur
Route::post('instruktur/login', [LoginInstrukturController::class, 'logininstruktur']);
Route::post('instruktur/logout', [LoginInstrukturController::class, 'logout'])->middleware('auth:sanctum');
// Instruktur notification routes must be registered before the resource routes
// so that the literal path /instruktur/notifications does not get captured
// by the resource's {instruktur} parameter (which would attempt model binding)
Route::get('instruktur/notifications', [\App\Http\Controllers\InstrukturNotificationController::class, 'index'])->middleware('auth:sanctum');
Route::post('instruktur/notifications/{id}/read', [\App\Http\Controllers\InstrukturNotificationController::class, 'markRead'])->middleware('auth:sanctum');

Route::apiResource('instruktur', InstrukturManagementController::class)->middleware('auth:sanctum');

// Admin
Route::get('dashboard/pending-by-activity', [\App\Http\Controllers\Admin\DashboardController::class, 'pendingByActivity'])->middleware('auth:sanctum');
Route::get('dashboard/stats', [\App\Http\Controllers\Admin\DashboardController::class, 'stats'])->middleware('auth:sanctum');
Route::post('admins/login', [LoginController::class, 'login']);
Route::post('admins/logout', [LoginController::class, 'logout'])->middleware('auth:sanctum');
Route::resource('admins', UserApiController::class)->middleware('auth:sanctum');
Route::post('admins/create', [UserApiController::class, 'store']);
Route::put('admins/edit/{admin}', [UserApiController::class, 'update']);
Route::delete('admins/delete/{admin}', [UserApiController::class, 'destroy']);

// Endpoint to fix certificate number (admin)
Route::post('certificates/fix-number', [\App\Http\Controllers\Sertifikat\SertifikatPesertaController::class, 'fixCertificateNumber']);
    
Route::get('sertifikat-templates/preview/{templateId}', [SertifikatPesertaController::class, 'previewDummy']);
Route::get('sertifikat-templates/preview-by-user/{userId}', [SertifikatPesertaController::class, 'previewByUserCertificate']);
// --- SERTIFIKAT TEMPLATE ROUTES ---
Route::prefix('sertifikat-templates')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [SertifikatTemplateController::class, 'index']);
    Route::post('/', [SertifikatTemplateController::class, 'store']);
    Route::get('/editor', function () {
        return view('sertifikat.editor'); // Pastikan ada view sertifikat/editor.blade.php
    });
    Route::get('/{id}', [SertifikatTemplateController::class, 'show']);
    Route::put('/{id}', [SertifikatTemplateController::class, 'update']);
    Route::delete('/{id}', [SertifikatTemplateController::class, 'destroy']);
    Route::post('/send-selected', [SertifikatPesertaController::class, 'sendMailPeserta']);
    Route::get('/download-by-user/{userId}', [SertifikatPesertaController::class, 'downloadByUserCertificate']);

    Route::post('/upload-image', [SertifikatTemplateController::class, 'uploadImage'])->name('sertifikat.upload-image');

    Route::prefix('sertifikat-templates/{id}')->group(function () {
        Route::get('/shapes', [SertifikatTemplateController::class, 'getShapes']);
        Route::post('/shapes', [SertifikatTemplateController::class, 'addShape']);
        Route::put('/shapes/{shapeId}', [SertifikatTemplateController::class, 'updateShape']);
        Route::delete('/shapes/{shapeId}', [SertifikatTemplateController::class, 'deleteShape']);
        Route::post('/shapes/update-order', [SertifikatTemplateController::class, 'updateShapesOrder']);
    });
    
    // PDF related routes
    // Route::post('/{id}/preview-template', [SertifikatPesertaController::class, 'previewPDF']);
    // Route::post('/{id}/generate-pdf', [SertifikatPesertaController::class, 'generatePDF']);
    Route::post('/{id}/generate-bulk-pdf', [SertifikatPesertaController::class, 'generateBulkPDF']); // Endpoint Generate pakai yang ini
    Route::post('/{id}/generate-bulk-number', [SertifikatPesertaController::class, 'generateBulkNumber']); // Generate hanya nomor sertifikat + token
    Route::get('/tasks/{token}', [SertifikatPesertaController::class, 'getTaskStatus']);
    Route::get('/download/{token}', [SertifikatPesertaController::class, 'downloadPDF']);
    Route::get('/preview/{token}', [SertifikatPesertaController::class, 'previewPDFWithToken']);
    Route::get('/users/{userId}/certificates', [SertifikatPesertaController::class, 'getUserCertificates']); // Endpoint buat halaman peserta
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/notifications', [AdminNotificationController::class, 'index']);
    Route::post('/admin/notifications/{id}/read', [AdminNotificationController::class, 'markRead']);
    // Instruktur notifications (instruktur authenticates with sanctum)
    Route::get('/instruktur/notifications', [\App\Http\Controllers\InstrukturNotificationController::class, 'index']);
    Route::post('/instruktur/notifications/{id}/read', [\App\Http\Controllers\InstrukturNotificationController::class, 'markRead']);
});



// ROUTE SMTP
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/smtp', [SmtpController::class, 'index']);
    Route::put('/smtp', [SmtpController::class, 'editOrCreate']);
    Route::put('/smtp/test', [SmtpController::class, 'testSend']);
});

Route::post('sertifikat/validate/peserta', [SertifikatPesertaController::class, 'getCertificateByNumber']);

Route::get('/latest-qrcode', function () {
    // Get latest QR code from storage
    $files = Storage::disk('public')->files('qrcodes');
    
    if (empty($files)) {
        return response()->json(['error' => 'No QR codes found'], 404);
    }

    // Sort files by modification time, newest first
    usort($files, function($a, $b) {
        return Storage::disk('public')->lastModified($b) - Storage::disk('public')->lastModified($a);
    });

    // Get the newest file
    $latestQR = $files[0];
    
    // Return the SVG content
    $content = Storage::disk('public')->get($latestQR);
    return response($content)->header('Content-Type', 'image/svg+xml');
});

// --- DEBUG & FALLBACK ROUTES ---
Route::get('/debug-cors', function (Request $request) {
    Log::debug('DEBUG GET CORS HIT', [
        'Origin' => $request->headers->get('Origin'),
        'Headers' => $request->headers->all(),
    ]);
    return response()->json(['ok' => true]);
});

Route::get('/phpinfo', function() {
    phpinfo();
});

// Return available font weight files for a font family under public/fonts/{font}
Route::get('fonts/{font}/weights', [SertifikatTemplateController::class, 'fontWeights']);

// Fallback route, harus selalu di paling bawah
Route::get('{any}', function () {
    return response()->json(['message' => 'Not Found'], 404);
})->where('any', '.*');
