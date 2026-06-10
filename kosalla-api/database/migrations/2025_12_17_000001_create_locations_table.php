<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->restrictOnDelete();

            $table->string('name', 200);
            $table->string('code', 50);
            $table->text('address')->nullable();

            $table->timestamps();

            $table->unique(['organization_id', 'code']);
            $table->index(['organization_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};

