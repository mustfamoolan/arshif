<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        \App\Models\Customer::observe(\App\Observers\CustomerObserver::class);

        // التأكد التلقائي من وجود الرابط الرمزي للصور public/storage بعد أي دبلوي أو تحديث للسيرفر
        $storagePath = public_path('storage');
        if (!file_exists($storagePath) && !is_link($storagePath)) {
            try {
                \Illuminate\Support\Facades\Artisan::call('storage:link', ['--force' => true]);
            } catch (\Throwable $e) {
                // محاولة بديلة لربط المجلد في الاستضافات المشتركة
                $targetPath = storage_path('app/public');
                if (file_exists($targetPath) && function_exists('symlink')) {
                    @symlink($targetPath, $storagePath);
                }
            }
        }
    }
}
