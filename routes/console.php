<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Models\ActivityLog;

Schedule::call(function () {
    ActivityLog::where('created_at', '<', now()->subDays(30))->delete();
})->monthly()->description('Clean activity logs older than 30 days');
