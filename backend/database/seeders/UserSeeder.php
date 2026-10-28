<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!User::where('email', 'admin@qadri.com')->exists()) {
            User::create([
                'name' => 'Administrator',
                'email' => 'admin@qadri.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'is_active' => true,
            ]);
        }

        if (!User::where('email', 'cashier@qadri.com')->exists()) {
            User::create([
                'name' => 'Cashier Counter',
                'email' => 'cashier@qadri.com',
                'password' => Hash::make('cashier123'),
                'role' => 'cashier',
                'is_active' => true,
            ]);
        }
    }
}
