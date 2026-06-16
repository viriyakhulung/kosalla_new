<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * branches — sub-unit milik satu organisasi. Cabang berada DI ATAS lokasi:
 * organization → branches → locations → tickets (via location_id).
 *
 * Kebijakan: TANPA FK constraint (kolom id plain). Integritas (org ada,
 * same-org saat lokasi memilih cabang, cascade) ditangani di aplikasi.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');   // plain, no FK
            $table->string('name', 200);
            $table->string('code', 50)->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['organization_id', 'code'], 'branches_org_code_unique');
            $table->index('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
