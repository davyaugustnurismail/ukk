<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Smtp;

class SmtpSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'Mail_Mailer'       => 'smtp',
            'Mail_Host'         => 'smtp.gmail.com',
            'Mail_Port'         => '587',
            'Mail_Username'     => 'sertifikatdiantaraintermedia@gmail.com',
            'Mail_Password'     => 'lfxojkhqelyrdajp',
            'Mail_Encryption'   => 'tls',
            'Mail_From_Address' => 'noreply@example.com',
            'Mail_From_Name'    => 'SertifikatOnlineDiantara',
        ];

        foreach ($defaults as $k => $v) {
            Smtp::updateOrCreate(['name' => $k], ['value' => $v]);
        }
    }
}

