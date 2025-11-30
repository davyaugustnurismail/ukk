<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FindDuplicateMerchantEmails extends Command
{
    protected $signature = 'scan:duplicate-merchant-emails';
    protected $description = 'Scan admins and instrukturs for duplicate (merchant_id, email) entries';

    public function handle()
    {
        $this->info('Scanning admins table...');
        $admins = DB::select(<<<SQL
            SELECT merchant_id, email, COUNT(*) as cnt
            FROM admins
            GROUP BY merchant_id, email
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC
        SQL
        );

        if (count($admins) === 0) {
            $this->info('No duplicate (merchant_id, email) found in admins.');
        } else {
            $this->warn('Duplicates found in admins:');
            foreach ($admins as $r) {
                $this->line("merchant_id={$r->merchant_id} email={$r->email} count={$r->cnt}");
            }
        }

        $this->info('Scanning instrukturs table...');
        $instrukturs = DB::select(<<<SQL
            SELECT merchant_id, email, COUNT(*) as cnt
            FROM instrukturs
            GROUP BY merchant_id, email
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC
        SQL
        );

        if (count($instrukturs) === 0) {
            $this->info('No duplicate (merchant_id, email) found in instrukturs.');
        } else {
            $this->warn('Duplicates found in instrukturs:');
            foreach ($instrukturs as $r) {
                $this->line("merchant_id={$r->merchant_id} email={$r->email} count={$r->cnt}");
            }
        }

        $this->info('Scan complete.');
        return 0;
    }
}
