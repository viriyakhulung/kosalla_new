<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // 1) tambah inventory_item_id
            if (!Schema::hasColumn('tickets', 'inventory_item_id')) {
                $table->foreignId('inventory_item_id')
                    ->nullable()
                    ->constrained('inventory_items')
                    ->restrictOnDelete()
                    ->after('organization_id');
            }

            // 2) tambah description_html
            if (!Schema::hasColumn('tickets', 'description_html')) {
                $table->longText('description_html')->nullable()->after('subject');
            }

            // 3) optional: category + tagging_word (kalau mau)
            if (!Schema::hasColumn('tickets', 'category')) {
                $table->string('category', 200)->nullable()->after('subject');
            }
            if (!Schema::hasColumn('tickets', 'tagging_word')) {
                $table->string('tagging_word', 100)->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'inventory_item_id')) {
                $table->dropConstrainedForeignId('inventory_item_id');
            }
            if (Schema::hasColumn('tickets', 'description_html')) {
                $table->dropColumn('description_html');
            }
            if (Schema::hasColumn('tickets', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('tickets', 'tagging_word')) {
                $table->dropColumn('tagging_word');
            }
        });
    }
};
