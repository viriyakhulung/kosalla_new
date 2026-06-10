<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_articles', function (Blueprint $table) {
            $table->id();

            // per organisasi
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();

            // per product (wajib)
            $table->foreignId('product_id')->constrained('master_products');

            $table->string('title');
            $table->longText('body_html');

            // workflow: draft -> review -> (approved) -> published, atau rejected
            $table->string('status', 20)->default('draft'); // draft|review|published|rejected

            // reviewer ditentukan saat submit-review
            $table->foreignId('reviewer_id')->nullable()->constrained('users');

            $table->timestamp('submitted_at')->nullable();

            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');

            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users');
            $table->text('rejected_reason')->nullable();

            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users');

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');

            $table->timestamps();

            $table->index(['organization_id', 'product_id', 'status']);
            $table->index(['reviewer_id', 'status']);
            $table->index(['published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_articles');
    }
};
