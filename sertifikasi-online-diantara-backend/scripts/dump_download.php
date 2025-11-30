<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CertificateDownload;

$number = $argv[1] ?? 'CERT/0002/08/2025';
$cd = CertificateDownload::where('certificate_number', $number)->first();
if (!$cd) {
    echo json_encode(['found' => false, 'number' => $number]);
    exit(0);
}
echo json_encode($cd->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
