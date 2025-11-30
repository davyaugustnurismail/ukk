<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Instruktur;
use Illuminate\Support\Facades\Hash;

class InstrukturSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Instruktur::create([
            'name' => 'John Doe',
            'email' => 'instruktur@example.com',
            'password' => Hash::make('password'),
            'asal_institusi' => 'Institut XYZ',
            'jabatan' => 'Direktur',
            'role_id' => 2,
            'merchant_id' => 1,
        ]);
    }
}
