<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('contract_alert_dismissals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('contract_id')
                ->constrained('contracts')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('alert_type', 10); // D90|D30
            $table->timestamp('dismissed_at')->nullable();

            $table->timestamps();

            $table->unique(['contract_id', 'user_id', 'alert_type']);
            $table->index(['user_id', 'alert_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_alert_dismissals');
    }
};
