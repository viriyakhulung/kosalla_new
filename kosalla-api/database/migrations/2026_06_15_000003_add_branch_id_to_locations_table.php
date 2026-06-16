<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * locations.branch_id — lokasi opsional milik sebuah cabang (nullable, tanpa FK).
 * Nullable supaya lokasi lama tetap valid selama masa transisi.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('organization_id');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropIndex(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
