<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kb_articles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained('master_products');

            $table->string('title');
            $table->string('slug')->unique();

            $table->longText('body_html');

            $table->string('applies_to_version')->nullable();

            $table->string('status', 20)->default('draft'); // draft|review|published

            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('published_at')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->foreignId('published_by')->nullable()->constrained('users');

            $table->timestamps();

            $table->index(['product_id', 'status', 'published_at']);
            $table->index(['title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kb_articles');
    }
};
