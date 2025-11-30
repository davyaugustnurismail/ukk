<?php

namespace App\Models;

use \App\Models\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\BelongsToMerchant;

class Instruktur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToMerchant;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'signature',
        'role_id',
        'merchant_id',
        'phone_number',
        'jenis_kelamin',
        'asal_institusi',
        'jabatan',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
     public function role() 
    {
        return $this->belongsTo(Role::class, 'role_id');  
    }
}
