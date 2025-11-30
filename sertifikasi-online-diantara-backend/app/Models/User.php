<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use \App\Models\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\BelongsToMerchant;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, BelongsToMerchant;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $table = 'users';
    protected $fillable = [
        'name',
        'email',
        'no_hp',
        'asal_institusi',
        'password',
        'role_id',
        'merchant_id'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get all certificates assigned to this user.
     */
    public function certificates()
    {
        return $this->hasMany(UserCertificate::class, 'user_id');
    }

    /**
     * Get certificate downloads through user certificates.
     */
    public function certificateDownloads()
    {
        return $this->hasManyThrough(
            CertificateDownload::class,
            UserCertificate::class,
            'user_id',
            'id',
            'id',
            'certificate_download_id'
        );
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function daftarActivity()
    {
        return $this->belongsToMany(DataActivity::class, 'data_activity_user', 'user_id', 'data_activity_id')
            ->withPivot('certificate_number', 'tanggal_sertifikat')
            ->select(['data_activity.id', 'data_activity.activity_name']);
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

}
