<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // TANPA FK constraint (policy proyek) — integritas di level aplikasi.
            $table->unsignedBigInteger('closed_by')->nullable()->after('closed_at');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('closed_by');
        });
    }
};
