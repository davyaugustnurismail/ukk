<?php

namespace App\Http\Controllers;

use App\Models\Smtp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\File;

class SmtpController extends Controller
{

    public function index()
    {
        $rows = Smtp::all();
        // kembalikan sebagai key=>value map biar enak dipakai di frontend
        return response()->json([
            'status' => 'success',
            'data'   => $rows->mapWithKeys(fn($r) => [$r->name => $r->value]),
        ]);
    }

    public function testSend(Request $request)
    {
        $request->validate([
            'to'      => 'required|email',
            'subject' => 'nullable|string',
            'text'    => 'nullable|string',
        ]);

        $subject = $request->input('subject', 'SMTP Test Mail');
        $text    = $request->input('text', 'Hello! This is a test email from your SMTP configuration.');

        try {
            // Kirim email raw text
            Mail::raw($text, function ($m) use ($request, $subject) {
                $m->to($request->input('to'))->subject($subject);
            });

            return response()->json(['status' => 'success', 'message' => 'Test email sent.']);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to send test email: '.$e->getMessage(),
            ], 500);
        }
    }

    public function editOrCreate(Request $request)
    {
        // Validasi: terima array settings [{name,value}, ...] atau object asosiatif
        $validated = $request->validate([
            'settings' => 'required|array|min:1',
            'settings.*.name'  => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        // 1) Simpan/Update ke DB
        foreach ($validated['settings'] as $row) {
            Smtp::updateOrCreate(
                ['name' => $row['name']],
                ['value' => $row['value']]
            );
        }
        $map = [
            'Mail_Mailer'        => 'MAIL_MAILER',
            'Mail_Host'          => 'MAIL_HOST',
            'Mail_Port'          => 'MAIL_PORT',
            'Mail_Username'      => 'MAIL_USERNAME',
            'Mail_Password'      => 'MAIL_PASSWORD',
            'Mail_Encryption'    => 'MAIL_ENCRYPTION',
            'Mail_From_Address'  => 'MAIL_FROM_ADDRESS',
            'Mail_From_Name'     => 'MAIL_FROM_NAME',
        ];

        $all = Smtp::whereIn('name', array_keys($map))->get()->keyBy('name');
        $pairs = [];
        foreach ($map as $dbName => $envKey) {
            if ($all->has($dbName)) {
                $pairs[$envKey] = (string) $all[$dbName]->value;
            }
        }

        // 4) Tulis ke .env (backup + replace or append)
        $this->writeEnv($pairs);

        // 5) Refresh config cache agar langsung terpakai
        try {
            Artisan::call('config:clear');
            // opsional: Artisan::call('config:cache');
        } catch (\Throwable $e) {
            // aman diabaikan pada shared hosting yg restrict artisan
        }

        // 6) (Opsional) Set juga ke config() runtime supaya instan tanpa reload
        $this->applyToRuntimeConfig($pairs);

        return response()->json([
            'status' => 'success',
            'updated_env_keys' => array_keys($pairs),
        ]);
    }

    /**
     * Menulis kunci ke file .env:
     * - backup .env => .env.backup-YYYYmmddHis
     * - replace baris jika key sudah ada, atau append jika belum
     * - auto-quote value jika perlu (spasi, #, =, &, dll)
     */
    protected function writeEnv(array $keyValues): void
    {
        $envPath = base_path('.env');
        if (!File::exists($envPath)) {
            // Jika tidak ada, buat file kosong
            File::put($envPath, '');
        }

        // Backup
        $backupPath = base_path('.env.backup-'.now()->format('YmdHis'));
        File::copy($envPath, $backupPath);

        $envContent = File::get($envPath);

        foreach ($keyValues as $key => $value) {
            $value = $this->sanitizeEnvValue($value);

            $pattern = "/^{$key}=.*$/m";
            if (preg_match($pattern, $envContent)) {
                // Replace baris existing
                $envContent = preg_replace($pattern, "{$key}={$value}", $envContent);
            } else {
                // Tambahkan baru di akhir file
                $envContent .= PHP_EOL."{$key}={$value}";
            }
        }

        File::put($envPath, $envContent);
    }

    /**
     * Quote jika perlu, dan escape karakter spesial agar aman di .env
     */
    protected function sanitizeEnvValue(?string $value): string
    {
        $value = (string) ($value ?? '');

        // Jika mengandung spasi/karakter spesial, bungkus dengan double-quote
        if (preg_match('/\s|#|=|&|:|\'|\"/', $value)) {
            // Escape double-quote di dalam value
            $value = '"'.str_replace('"', '\"', $value).'"';
        }

        return $value;
    }

    /**
     * Supaya tidak perlu reload, langsung apply ke config runtime.
     */
    protected function applyToRuntimeConfig(array $pairs): void
    {
        // Mailer dasar (sesuaikan dengan config/mail.php kamu)
        if (isset($pairs['MAIL_MAILER'])) {
            config(['mail.default' => $pairs['MAIL_MAILER']]);
        }
        if (isset($pairs['MAIL_HOST'])) {
            config(['mail.mailers.smtp.host' => $pairs['MAIL_HOST']]);
        }
        if (isset($pairs['MAIL_PORT'])) {
            config(['mail.mailers.smtp.port' => (int) $pairs['MAIL_PORT']]);
        }
        if (isset($pairs['MAIL_USERNAME'])) {
            config(['mail.mailers.smtp.username' => $pairs['MAIL_USERNAME']]);
        }
        if (isset($pairs['MAIL_PASSWORD'])) {
            config(['mail.mailers.smtp.password' => $pairs['MAIL_PASSWORD']]);
        }
        if (isset($pairs['MAIL_ENCRYPTION'])) {
            config(['mail.mailers.smtp.encryption' => $pairs['MAIL_ENCRYPTION'] ?: null]);
        }
        if (isset($pairs['MAIL_FROM_ADDRESS'])) {
            config(['mail.from.address' => $pairs['MAIL_FROM_ADDRESS']]);
        }
        if (isset($pairs['MAIL_FROM_NAME'])) {
            config(['mail.from.name' => $pairs['MAIL_FROM_NAME']]);
        }
    }
}
