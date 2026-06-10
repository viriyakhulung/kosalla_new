<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('master_products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            $table->string('product_type', 30)->default('software'); // sejajar dengan inventory_items
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->index(['product_type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_products');
    }
};
