<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Sesuaikan dengan PostgreSQL: ALTER COLUMN ... DROP NOT NULL
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'contract_id')) {
                $table->unsignedBigInteger('contract_id')->nullable()->after('organization_id');
            } else {
                DB::statement('ALTER TABLE tickets ALTER COLUMN contract_id DROP NOT NULL');
            }

            if (Schema::hasColumn('tickets', 'inventory_item_id')) {
                DB::statement('ALTER TABLE tickets ALTER COLUMN inventory_item_id DROP NOT NULL');
            }
        });
    }

    public function down(): void
    {
        // Set kembali NOT NULL (akan gagal jika sudah ada nilai null)
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'contract_id')) {
                DB::statement('ALTER TABLE tickets ALTER COLUMN contract_id SET NOT NULL');
            }

            if (Schema::hasColumn('tickets', 'inventory_item_id')) {
                DB::statement('ALTER TABLE tickets ALTER COLUMN inventory_item_id SET NOT NULL');
            }
        });
    }
};
