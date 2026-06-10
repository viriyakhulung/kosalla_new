<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('ticket_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->boolean('is_internal')->default(false)->index(); // internal note vs reply ke enduser
            $table->text('body');

            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('ticket_replies');
    }
};
