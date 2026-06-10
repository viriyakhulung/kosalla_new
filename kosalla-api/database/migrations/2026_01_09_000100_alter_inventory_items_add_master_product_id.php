<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // Tambah kolom master_product_id (nullable dulu)
            if (!Schema::hasColumn('inventory_items', 'master_product_id')) {
                $table->foreignId('master_product_id')
                    ->nullable()
                    ->after('organization_id')
                    ->constrained('master_products')
                    ->nullOnDelete();
            }
        });

        // Drop unique lama (organization_id, name) supaya tidak bentrok nama sama di org berbeda
        try {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->dropUnique(['organization_id', 'name']);
            });
        } catch (\Throwable $e) {
            // abaikan jika index tidak ada
        }

        // Jadikan nama/product_type nullable (kita isi dari master product)
        Schema::table('inventory_items', function (Blueprint $table) {
            try {
                $table->string('name', 150)->nullable()->change();
                $table->string('product_type', 30)->nullable()->change();
            } catch (\Throwable $e) {
                // versi Postgres kadang tidak mendukung change; abaikan jika gagal
            }
        });

        // Unique baru: per org, master_product_id
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->unique(['organization_id', 'master_product_id']);
        });
    }

    public function down(): void
    {
        // rollback unik baru
        Schema::table('inventory_items', function (Blueprint $table) {
            try {
                $table->dropUnique(['organization_id', 'master_product_id']);
            } catch (\Throwable $e) {
            }
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_items', 'master_product_id')) {
                $table->dropConstrainedForeignId('master_product_id');
            }
        });

        // Optional: kembalikan unique lama
        Schema::table('inventory_items', function (Blueprint $table) {
            try {
                $table->unique(['organization_id', 'name']);
            } catch (\Throwable $e) {
            }
        });
    }
};
