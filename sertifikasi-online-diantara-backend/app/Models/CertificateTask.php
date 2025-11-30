<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateTask extends Model
{
    protected $table = 'certificate_tasks';
    protected $guarded = [];
    protected $casts = [
        'payload' => 'array',
    ];
}
