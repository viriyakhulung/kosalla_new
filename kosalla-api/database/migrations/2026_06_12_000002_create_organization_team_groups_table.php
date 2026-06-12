<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot organisation_attach_teams: hubungkan organisasi ke team group.
 * Satu tim bisa di-attach ke banyak organisasi, dan sebaliknya (many-to-many).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('organization_team_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();
            $table->foreignId('team_group_id')
                ->constrained('team_groups')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['organization_id', 'team_group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_team_groups');
    }
};
