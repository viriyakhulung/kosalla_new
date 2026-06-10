<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('contract_inventory_items', function (Blueprint $table) {
            $table->foreignId('contract_id')
                ->constrained('contracts')
                ->cascadeOnDelete();

            $table->foreignId('inventory_item_id')
                ->constrained('inventory_items')
                ->restrictOnDelete();

            $table->unsignedInteger('quantity')->default(1);
            $table->text('notes')->nullable();

            $table->primary(['contract_id', 'inventory_item_id']);
            $table->index(['inventory_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_inventory_items');
    }
};

