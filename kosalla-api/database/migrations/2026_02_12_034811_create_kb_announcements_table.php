<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kb_announcements', function (Blueprint $table) {
            $table->id();

            $table->string('scope', 20)->default('product'); // global|product
            $table->foreignId('product_id')->nullable()
                ->constrained('master_products');

            $table->string('title');
            $table->longText('body_html');

            $table->string('status', 20)->default('draft'); // draft|review|published

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('published_at')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->foreignId('published_by')->nullable()->constrained('users');

            $table->timestamps();

            $table->index(['scope', 'product_id', 'status']);
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kb_announcements');
    }
};
