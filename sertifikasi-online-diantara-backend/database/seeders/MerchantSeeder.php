<?php

namespace Database\Seeders;

use App\Models\Merchant;
use Illuminate\Database\Seeder;

class MerchantSeeder extends Seeder
{
    public function run(): void
    {
        Merchant::create([
            'name' => 'Default Merchant'
        ]);
    }
}
