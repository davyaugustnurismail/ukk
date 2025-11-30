<?php

namespace Database\Seeders;

use App\Models\Admin as ModelsAdmin;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class Admin extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        ModelsAdmin::create([
            'name' => 'Admin',
            'email' => 'dev@diantara.net',
            'password' => Hash::make('programmer'),
            'role_id' => 1,
            'merchant_id' => 1,
        ]);

        $this->command->info('Admin user created successfully.');
    }
}
