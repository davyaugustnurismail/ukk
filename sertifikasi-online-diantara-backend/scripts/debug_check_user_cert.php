<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\UserCertificate;
use App\Models\CertificateDownload;
use Illuminate\Support\Facades\DB;

$userId = isset($argv[1]) ? intval($argv[1]) : 1;
$dataActivityId = isset($argv[2]) ? intval($argv[2]) : 1;

echo "Checking user_id={$userId}, data_activity_id={$dataActivityId}\n";

try {
    echo "\nUserCertificate entries:\n";
    $ucs = UserCertificate::where('user_id', $userId)->with('certificateDownload')->get()->toArray();
    print_r($ucs);

    echo "\nCertificateDownload entries for user:\n";
    $cds = CertificateDownload::where('user_id', $userId)->get()->toArray();
    print_r($cds);

    echo "\nPivot data_activity_user rows for user and activity:\n";
    $piv = DB::table('data_activity_user')->where('user_id', $userId)->where('data_activity_id', $dataActivityId)->get()->toArray();
    print_r($piv);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "Done.\n";
