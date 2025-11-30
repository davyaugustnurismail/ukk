<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

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

// admin notification endpoints are defined in routes/web.php for this project
