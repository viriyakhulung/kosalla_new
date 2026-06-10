<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('slug', 200)->unique();

            $table->string('contact_email', 200)->nullable();
            $table->string('phone', 50)->nullable();
            $table->text('address')->nullable();

            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->index(['name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
