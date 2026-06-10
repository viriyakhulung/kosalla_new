<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('engineers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('title', 100)->nullable(); // DBA, Backend, Infra, dll
            $table->string('level', 30)->default('mid'); // junior|mid|senior|lead
            $table->string('phone', 50)->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique('user_id');
            $table->index(['is_active', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('engineers');
    }
};
