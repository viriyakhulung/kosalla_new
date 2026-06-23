<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ADDITIVE ONLY: tambah kolom team_group_id (nullable) ke master_products
 * untuk mapping 1:1 produk → team PIC.
 *
 * Policy proyek untuk kolom BARU: TANPA FK/constrained/cascade — integritas
 * dijaga di application layer. Tidak ada backfill, tidak menyentuh baris existing.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('master_products', 'team_group_id')) {
            Schema::table('master_products', function (Blueprint $table) {
                $table->unsignedBigInteger('team_group_id')->nullable()->after('product_type');
                $table->index('team_group_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('master_products', 'team_group_id')) {
            Schema::table('master_products', function (Blueprint $table) {
                $table->dropIndex(['team_group_id']);
                $table->dropColumn('team_group_id');
            });
        }
    }
};
