<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // Hapus unique global pada kolom name jika ada
            try {
                $table->dropUnique('inventory_items_name_unique');
            } catch (\Throwable $e) {
                // abaikan jika index tidak ada
            }
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            try {
                $table->unique('name');
            } catch (\Throwable $e) {
                // abaikan jika sudah ada / gagal
            }
        });
    }
};
