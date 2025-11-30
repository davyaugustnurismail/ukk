<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'roles';

    protected $fillable = [
        'name'
    ];

    // Relasi ke User
    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }

    // Relasi ke Instruktur
    public function instrukturs()
    {
        return $this->hasMany(Instruktur::class, 'role_id');
    }

    // Relasi ke Admin
    public function admins()
    {
        return $this->hasMany(Admin::class, 'role_id');
    }
}
