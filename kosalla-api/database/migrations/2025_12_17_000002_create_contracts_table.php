<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->restrictOnDelete();

            $table->string('contract_number', 120);
            $table->date('start_date');
            $table->date('end_date');

            $table->string('status', 30)->default('active'); // active|expired|terminated
            $table->unsignedSmallInteger('reminder_days_before_end')->default(90);
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['organization_id', 'contract_number']);
            $table->index(['organization_id', 'end_date']); // expiringSoon
            $table->index(['status', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};

