<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToMerchant;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\CertificateDownload;

class UserCertificate extends Model
{
    use BelongsToMerchant;
    protected $fillable = [
        'user_id',
        'certificate_download_id',
        'status',
        'assigned_at',
        'qrcode_path',
        'merchant_id',
        'data_activity_id'
    ];

    protected $casts = [
        'assigned_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();
    }

    /**
     * Get the user that owns this certificate.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the certificate download record.
     */
    public function certificateDownload()
    {
        return $this->belongsTo(CertificateDownload::class, 'certificate_download_id');
    }

    /**
     * Check if the certificate is active.
     */
    public function isActive()
    {
        return $this->status === 'active';
    }
}
