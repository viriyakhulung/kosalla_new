<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('product_types', function (Blueprint $table) {
    $table->id();
    $table->foreignId('organization_id')
        ->constrained('organizations')
        ->restrictOnDelete();

    $table->string('name', 120);
    $table->string('code', 50); // wajib, misal: "SVR", "DB", "LIC"
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);

    $table->timestamps();
    $table->softDeletes();

    $table->unique(['organization_id', 'code']);
    $table->index(['organization_id', 'is_active']);
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_types');
    }
};
