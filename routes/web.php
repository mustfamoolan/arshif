<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('customers.index');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return redirect()->route('customers.index');
})->middleware(['auth'])->name('dashboard');

// Protected Routes for Authenticated Users
Route::middleware(['auth'])->group(function () {
    Route::resource('customers', CustomerController::class);
});

// Protected Admin Routes for User Management & Auditing
Route::middleware(['auth', 'admin'])->group(function () {
    Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('/activity-logs', [App\Http\Controllers\ActivityLogController::class, 'index'])->name('activity-logs.index');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
