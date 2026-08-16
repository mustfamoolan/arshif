<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed default Admin user
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'المدير العام',
                'username' => 'admin',
                'email' => 'admin@alhadi.com',
                'role' => 'admin',
                'status' => 'active',
                'password' => Hash::make('12345678'),
            ]
        );

    
    }
}
