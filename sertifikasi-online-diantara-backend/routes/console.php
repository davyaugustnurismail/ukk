<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('inspire')
    ->everyMinute()
    ->appendOutputTo(storage_path('logs/schedule-test.log'));

Schedule::command('queue:work --stop-when-empty')
    ->everyMinute()
    ->appendOutputTo(storage_path('logs/queue.log'));