<?php

namespace Database\Seeders;

use App\Models\DataActivity;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        
        $this->call(MerchantSeeder::class);
        $this->call(RoleSeeder::class);
        $this->call(InstrukturSeeder::class);
        $this->call(Admin::class);
        $this->call(SmtpSeeder::class);

        $user = User::factory()->create([
            'name' => 'Test User',
            'no_hp' => '081234567890',
            'asal_institusi' => 'PT. Example',
            'email' => 'test@example.com',
            'role_id' => 3,
            'merchant_id' => 1,
        ]);


    }
}
