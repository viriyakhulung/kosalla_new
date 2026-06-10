<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kb_announcement_reads', function (Blueprint $table) {
            $table->id();

            $table->foreignId('announcement_id')
                ->constrained('kb_announcements')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamp('dismissed_at')->nullable();

            $table->timestamps();

            $table->unique(['announcement_id', 'user_id']);
            $table->index(['user_id', 'dismissed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kb_announcement_reads');
    }
};
