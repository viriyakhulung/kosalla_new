<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // sementara nullable dulu supaya tidak error untuk data lama
            $table->foreignId('organization_id')
                ->nullable()
                ->after('id')
                ->constrained('organizations')
                ->restrictOnDelete();
        });

        /**
         * Backfill data lama:
         * - Kalau inventory_items sudah ada datanya, kita isi organization_id default.
         * - Pilih org default: biasanya Viriya (misal id=3) atau ambil org pertama.
         */
        $defaultOrgId = DB::table('organizations')->min('id'); // ambil paling kecil
        if ($defaultOrgId) {
            DB::table('inventory_items')
                ->whereNull('organization_id')
                ->update(['organization_id' => $defaultOrgId]);
        }

        // setelah backfill, baru jadikan NOT NULL + index unique
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable(false)->change();
            $table->index(['organization_id', 'is_active']);
            $table->unique(['organization_id', 'name']); // optional tapi recommended
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropUnique(['organization_id', 'name']);
            $table->dropIndex(['organization_id', 'is_active']);
            $table->dropConstrainedForeignId('organization_id');
        });
    }
};
