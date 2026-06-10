<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('team_groups', function (Blueprint $table) {
            if (!Schema::hasColumn('team_groups', 'organization_id')) {
                $table->foreignId('organization_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('organizations')
                    ->nullOnDelete();
            }
            if (!Schema::hasColumn('team_groups', 'handles_category')) {
                $table->string('handles_category', 100)->nullable()->after('code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('team_groups', function (Blueprint $table) {
            if (Schema::hasColumn('team_groups', 'handles_category')) {
                $table->dropColumn('handles_category');
            }
            if (Schema::hasColumn('team_groups', 'organization_id')) {
                $table->dropConstrainedForeignId('organization_id');
            }
        });
    }
};
