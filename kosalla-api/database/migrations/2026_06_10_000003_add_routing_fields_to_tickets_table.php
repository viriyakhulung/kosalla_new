<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'team_group_id')) {
                $table->foreignId('team_group_id')
                    ->nullable()
                    ->after('location_id')
                    ->constrained('team_groups')
                    ->nullOnDelete();
            }
            if (!Schema::hasColumn('tickets', 'assigned_to')) {
                $table->foreignId('assigned_to')
                    ->nullable()
                    ->after('team_group_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (!Schema::hasColumn('tickets', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('updated_at');
            }
            if (!Schema::hasColumn('tickets', 'closed_at')) {
                $table->timestamp('closed_at')->nullable()->after('resolved_at');
            }
            if (!Schema::hasColumn('tickets', 'last_activity_at')) {
                $table->timestamp('last_activity_at')->nullable()->after('closed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            foreach (['last_activity_at', 'closed_at', 'resolved_at'] as $col) {
                if (Schema::hasColumn('tickets', $col)) {
                    $table->dropColumn($col);
                }
            }
            if (Schema::hasColumn('tickets', 'assigned_to')) {
                $table->dropConstrainedForeignId('assigned_to');
            }
            if (Schema::hasColumn('tickets', 'team_group_id')) {
                $table->dropConstrainedForeignId('team_group_id');
            }
        });
    }
};
