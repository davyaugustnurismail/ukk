<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Mail Settings
    |--------------------------------------------------------------------------
    |
    | Konfigurasi pengiriman email menggunakan PHPMailer
    |
    */

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'noreply@yourdomain.com'),
        'name' => env('MAIL_FROM_NAME', 'Your Company Name'),
    ],

    // Untuk development/local
    'local' => [
        'host' => 'localhost',
        'port' => 25,
        'sendmail_path' => env('SENDMAIL_PATH', '/usr/sbin/sendmail -t -i'),
    ],

    // Untuk production
    'production' => [
        'sendmail_path' => '/usr/sbin/sendmail -t -i',
        'return_path' => env('MAIL_RETURN_PATH', 'bounces@yourdomain.com'),
    ],

    // Debug mode
    'debug' => env('MAIL_DEBUG', false),
    
    // Log settings
    'logging' => [
        'enabled' => true,
        'path' => storage_path('logs/mail.log'),
    ],
];
