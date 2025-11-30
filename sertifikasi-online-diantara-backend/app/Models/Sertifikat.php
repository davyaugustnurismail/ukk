<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToMerchant;
use Laravel\Sanctum\HasApiTokens;

class Sertifikat extends Model
{
    use BelongsToMerchant, HasApiTokens;
    protected $fillable = [
        'name',
        'background_image',
        'layout',
        'elements',
        'is_active',
        // 'certificate_number_format', // intentionally removed: column may be dropped in some installations
        'last_certificate_number',
        'merchant_id'
    ];

    protected $casts = [
        'id' => 'integer',
        'layout' => 'array',
        'elements' => 'array',
        'is_active' => 'boolean',
    ];

    public $timestamps = true;

    /**
     * Get all downloads for this certificate template.
     */
    public function downloads()
    {
        return $this->hasMany(CertificateDownload::class);
    }

    /**
     * Create a new download record for this certificate.
     */
    public function createDownload($data)
    {
        return $this->downloads()->create([
            'token' => $data['token'],
            'filename' => $data['filename'],
            'recipient_name' => $data['recipient_name'],
            'instruktur_name' => $data['instruktur_name'] ?? null,
            'certificate_number' => $data['certificate_number'],
            'user_id' => $data['user_id'] ?? null,
            // 'expires_at' => $data['expires_at'] ?? null,
            'data_activity_id' => $data['data_activity_id'] ?? null,
            'merchant_id' => $data['merchant_id'] ?? null,
        ]);
    }

    public function activities()
    {
        return $this->belongsToMany(DataActivity::class, 'certificate_data_activity', 'sertifikat_id', 'data_activity_id', '')
                    ->withPivot('status', 'is_active', 'sent_by_admin_name', 'created_at')
                    ->withTimestamps();
    }
}
