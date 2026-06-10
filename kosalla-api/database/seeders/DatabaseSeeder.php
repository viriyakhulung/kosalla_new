<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed master roles dulu
        $this->call(MasterRoleSeeder::class);

        // Buat user untuk login FE (tanpa Spatie assignRole)
        User::updateOrCreate(
            ['email' => 'superadmin@kosalla.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                // Kalau kamu punya kolom master_role_id, aktifkan baris ini:
                // 'master_role_id' => 1,
            ]
        );
    }
}
