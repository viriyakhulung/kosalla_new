<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('team_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);        // contoh: DB, Apps, Integration, Infra
            $table->string('code', 50)->unique(); // contoh: db, apps, integration, infra
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_groups');
    }
};
