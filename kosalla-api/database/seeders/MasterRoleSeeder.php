<?php

namespace Database\Seeders;

use App\Models\MasterRole;
use Illuminate\Database\Seeder;

class MasterRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'superadmin', 'description' => 'Super Administrator'],
            ['name' => 'viriyastaff', 'description' => 'Viriya Staff (Engineer)'],
            ['name' => 'custstaff', 'description' => 'Customer Staff (End User)'],
        ];

        foreach ($roles as $role) {
            MasterRole::firstOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
}
