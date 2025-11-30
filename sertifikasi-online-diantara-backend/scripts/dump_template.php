<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Sertifikat;

$id = $argv[1] ?? 2;
$record = Sertifikat::find($id);
if (!$record) {
    echo json_encode(['error' => 'not found', 'id' => (int)$id]);
    exit(1);
}

echo json_encode($record->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
