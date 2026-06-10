<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('team_group_user', function (Blueprint $table) {
            $table->id();

            $table->foreignId('team_group_id')
                ->constrained('team_groups')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // role di dalam team group
            $table->string('role', 50)->default('engineer-staff'); 
            // contoh: engineer-manager | engineer-staff

            $table->timestamps();

            // 1 user tidak boleh di-assign 2x ke team group yang sama
            $table->unique(['team_group_id', 'user_id']);
            $table->index(['user_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_group_user');
    }
};
