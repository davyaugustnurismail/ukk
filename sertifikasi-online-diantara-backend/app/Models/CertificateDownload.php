<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToMerchant;

class CertificateDownload extends Model
{
    use BelongsToMerchant;

    protected $table = 'certificate_downloads';
    protected $fillable = [
        'sertifikat_id',
        'token',
        'filename',
        'recipient_name',
        'certificate_number',
        'user_id',
        'expires_at',
        'merchant_id',
        'data_activity_id',
        'sent_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'sent_at' => 'datetime'
    ];

    /**
     * Get the certificate template that this download belongs to.
     */
    public function sertifikat()
    {
        return $this->belongsTo(Sertifikat::class);
    }

    /**
     * Get the user who generated this certificate (if any).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the download token has expired.
     */
    public function isExpired()
    {
        return $this->expires_at && now()->greaterThan($this->expires_at);
    }

    /**
     * Increment the download count.
     */
    public function incrementDownloadCount()
    {
        $this->increment('download_count');
    }

    public function dataActivity()
    {
        return $this->belongsTo(DataActivity::class);
    }

    /**
     * Normalize certificate number for reliable comparison.
     * Removes control characters, normalizes unicode, and converts similar slashes to '/'.
     */
    public static function normalizeCertificateNumber(?string $num): ?string
    {
        if ($num === null) return null;
        // ensure UTF-8
        $s = @mb_convert_encoding($num, 'UTF-8', 'UTF-8');
        // remove control chars
        $s = preg_replace('/[\x00-\x1F\x7F]+/u', '', $s);
        // replace alternative slash-like chars with ASCII '/'
        $s = str_replace(['\u{2215}', '∕', '／', '⁄', '∖'], '/', $s);
        // normalize unicode (if intl available)
        if (function_exists('normalizer_normalize')) {
            $s = normalizer_normalize($s, \Normalizer::FORM_C) ?: $s;
        }
        // trim
        $s = trim($s);
        return $s;
    }

    /**
     * Scope a query to find by normalized certificate number.
     */
    public function scopeWhereCertificateNumberNormalized($query, $value)
    {
        $normalized = self::normalizeCertificateNumber($value);
        if ($normalized === null) {
            return $query->whereRaw('1=0');
        }

        // Try exact match first
        $q = $query->where('certificate_number', $normalized);

        // Also try case-insensitive
        return $q->orWhereRaw('certificate_number ILIKE ?', [$normalized]);
    }
}
