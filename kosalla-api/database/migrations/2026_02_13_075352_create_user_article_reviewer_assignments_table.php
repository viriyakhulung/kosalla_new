<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_article_reviewer_assignments', function (Blueprint $table) {
            $table->id();

            // nullable = global per product
            $table->foreignId('organization_id')->nullable()
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->foreignId('product_id')->constrained('master_products')->cascadeOnDelete();

            $table->foreignId('reviewer_user_id')->constrained('users')->cascadeOnDelete();

            $table->timestamps();

            // org-specific: 1 reviewer per org+product
            $table->unique(['organization_id', 'product_id'], 'ua_rev_org_product_unique');

            $table->index(['product_id', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_article_reviewer_assignments');
    }
};
