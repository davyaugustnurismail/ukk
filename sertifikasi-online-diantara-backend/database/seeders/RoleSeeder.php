<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        Role::firstOrCreate([
            'id' => 1,
            'name' => 'admins',
        ]);

        Role::firstOrCreate([
            'id' => 2,
            'name' => 'instrukturs',
        ]);

        Role::firstOrCreate([
            'id' => 3,
            'name' => 'users',
        ]);

        Role::firstOrCreate([
            'id' => 4,
            'name' => 'panitia',
        ]);

        Role::firstOrCreate([
            'id' => 5,
            'name' => 'narasumber',
        ]);
    }
}
