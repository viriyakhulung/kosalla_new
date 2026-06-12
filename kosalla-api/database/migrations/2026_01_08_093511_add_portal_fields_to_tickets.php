<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Tambahkan hanya jika belum ada (hindari duplicate column)
            if (!Schema::hasColumn('tickets', 'category')) {
                $table->string('category', 200)->nullable()->after('subject');
            }
            if (!Schema::hasColumn('tickets', 'inventory_item_id')) {
                $table->unsignedBigInteger('inventory_item_id')->nullable()->after('category');
            }
            if (!Schema::hasColumn('tickets', 'tagging_word')) {
                $table->string('tagging_word', 100)->nullable()->after('inventory_item_id');
            }
            if (!Schema::hasColumn('tickets', 'description_html')) {
                $table->text('description_html')->nullable()->after('tagging_word');
            }
            if (!Schema::hasColumn('tickets', 'priority')) {
                $table->enum('priority', ['low', 'normal', 'high'])->default('normal')->after('description_html');
            }
            if (!Schema::hasColumn('tickets', 'status')) {
                $table->string('status', 50)->default('open')->after('priority');
            }
            if (!Schema::hasColumn('tickets', 'action_number')) {
                $table->string('action_number', 80)->nullable()->after('status');
            }
            if (!Schema::hasColumn('tickets', 'requested_resolution_date')) {
                $table->date('requested_resolution_date')->nullable()->after('action_number');
            }
            if (!Schema::hasColumn('tickets', 'expected_date')) {
                $table->date('expected_date')->nullable()->after('requested_resolution_date');
            }

            // FK optional (kalau ada tabel inventory_items)
            // if (!Schema::hasColumn('tickets', 'inventory_item_id')) {
            //     $table->foreign('inventory_item_id')->references('id')->on('inventory_items')->nullOnDelete();
            // }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $drops = [];
            foreach ([
                'category',
                'inventory_item_id',
                'tagging_word',
                'description_html',
                'priority',
                'status',
                'action_number',
                'requested_resolution_date',
                'expected_date',
            ] as $col) {
                if (Schema::hasColumn('tickets', $col)) {
                    $drops[] = $col;
                }
            }

            if (!empty($drops)) {
                $table->dropColumn($drops);
            }
        });
    }
};
