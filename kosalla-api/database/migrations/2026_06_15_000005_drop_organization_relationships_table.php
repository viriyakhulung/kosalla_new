<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('organization_relationships');
    }

    public function down(): void
    {
        // recreate sesuai migrasi asli bila perlu rollback (data tidak kembali)
        Schema::create('organization_relationships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_org_id');
            $table->unsignedBigInteger('related_org_id');
            $table->enum('role', ['distributor', 'customer']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('region', 120)->nullable();
            $table->string('code', 60)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['owner_org_id', 'related_org_id', 'role'], 'org_rel_unique');
            $table->index(['owner_org_id', 'role']);
            $table->index('related_org_id');
        });
    }
};
