<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * organization_relationships — pemetaan antar-organisasi (flat, berarah dari owner → related).
 *
 * Kebijakan: TANPA FK constraint di DB. Kolom id tetap plain integer.
 * Integritas (org ada, anti self-reference, cascade saat hapus org) ditangani di aplikasi.
 * Satu org bisa berperan sebagai distributor DAN customer sekaligus (peran = atribut relasi).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('organization_relationships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_org_id');     // plain, no FK
            $table->unsignedBigInteger('related_org_id');   // plain, no FK
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

    public function down(): void
    {
        Schema::dropIfExists('organization_relationships');
    }
};
