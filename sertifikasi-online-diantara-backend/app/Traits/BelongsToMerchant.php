<?php

namespace App\Traits;

use App\Models\Merchant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToMerchant
{
    /**
     * Boot the trait.
     *
     * This method automatically applies a global scope to filter data by the logged-in user's merchant_id
     * and sets the merchant_id when creating a new model.
     * It uses Auth::user() to be compatible with both web sessions and API tokens (Sanctum).
     */
    protected static function bootBelongsToMerchant()
    {
        // This global scope is applied to all queries for models using this trait.
        static::addGlobalScope('merchant', function (Builder $builder) {
            // Auth::user() is the standard, guard-agnostic way to get the authenticated user.
            $user = Auth::user();

            // Only apply the where clause if a user is authenticated and has a merchant_id.
            if ($user && !is_null($user->merchant_id)) {
                $builder->where($builder->getModel()->getTable() . '.merchant_id', $user->merchant_id);
            }
        });

        // This event is triggered when a new model instance is being created.
        static::creating(function ($model) {
            // Check if the merchant_id is not already set on the model.
            if (is_null($model->merchant_id)) {
                $user = Auth::user();

                // If a user is authenticated and has a merchant_id, assign it to the new model.
                if ($user && !is_null($user->merchant_id)) {
                    $model->merchant_id = $user->merchant_id;
                }
            }
        });
    }

    /**
     * Defines the relationship to the Merchant model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
}
