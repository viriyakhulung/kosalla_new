<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hard delete untuk locations & branches: buang kolom deleted_at.
 * Soft delete + unique(organization_id, code) menahan slot code yang sudah dihapus
 * sehingga code tidak bisa dipakai ulang (SQLSTATE 23505). Hard delete mengatasinya.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropSoftDeletes(); // drop deleted_at
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->softDeletes();
        });
    }
};
