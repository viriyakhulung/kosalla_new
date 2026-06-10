<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('team_group_user', function (Blueprint $table) {
            if (!Schema::hasColumn('team_group_user', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('team_group_user', function (Blueprint $table) {
            if (Schema::hasColumn('team_group_user', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
