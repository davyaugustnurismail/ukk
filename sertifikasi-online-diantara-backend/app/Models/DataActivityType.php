<?php

namespace App\Models;

use App\Traits\BelongsToMerchant;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class DataActivityType extends Model
{
    use BelongsToMerchant, HasApiTokens;
    protected $fillable = [
        'merchant_id',
        'type_name',
    ];

    protected $casts = [
        'merchant_id' => 'integer',
        'type_name' => 'string',
    ];

    public function activities()
    {
        return $this->hasMany(DataActivity::class, 'activity_type_id');
    }
}
