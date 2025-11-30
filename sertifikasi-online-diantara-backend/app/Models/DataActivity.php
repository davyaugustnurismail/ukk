<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToMerchant;
use Laravel\Sanctum\HasApiTokens;
use App\Enums\MemberType;

class DataActivity extends Model
{
    use HasFactory, BelongsToMerchant, HasApiTokens;
    
    protected $table = 'data_activity';

    protected $fillable = [
        'activity_name',
        'date',
        'time_start', 
        'time_end', 
        'activity_type_id',
        'location',
        'description',
        'instruktur_id',
        'sertifikat_id',
        'last_certificate_number',
        'generated',
        'merchant_id'
    ];

    // Casting ini sudah baik untuk memastikan tipe data yang konsisten.
    protected $attributes = [
        'generated' => false,
    ];

    protected $casts = [
        'date' => 'datetime',
        'time_start' => 'string',
        'time_end' => 'string',
        'generated' => 'boolean',
    ];

    /**
     * Mendefinisikan relasi ke tipe kegiatan.
     */
    public function activityType()
    {
        return $this->belongsTo(DataActivityType::class, 'activity_type_id');
    }

    /**
     * Mendefinisikan relasi ke instruktur.
     */
    public function instruktur()
    {
        return $this->belongsTo(Instruktur::class, 'instruktur_id');
    }

    public function peserta()
    {
        return $this->belongsToMany(User::class, 'data_activity_user', 'data_activity_id', 'user_id')
            ->withPivot('certificate_number', 'tanggal_sertifikat')
            ->wherePivot('type', MemberType::PESERTA->value)
            ->withTimestamps();
    }

    public function narasumber()
    {
        return $this->belongsToMany(User::class, 'data_activity_user', 'data_activity_id', 'user_id')
            ->withPivot('certificate_number', 'tanggal_sertifikat')
            ->wherePivot('type', MemberType::NARASUMBER->value)
            ->withTimestamps();
    }

    public function panitia()
    {
        return $this->belongsToMany(User::class, 'data_activity_user', 'data_activity_id', 'user_id')
            ->withPivot('certificate_number', 'tanggal_sertifikat')
            ->wherePivot('type', MemberType::PANITIA->value)
            ->withTimestamps();
    }

    public function sertifikat()
    {
        return $this->belongsToMany(Sertifikat::class, 'certificate_data_activity', )
                    ->withPivot('status', 'is_active', 'sent_by_admin_name', 'sent_at', 'created_at')
                    ->withTimestamps();
    }

    public function certificateDownloads()
    {
        return $this->hasMany(CertificateDownload::class);
    }
}
