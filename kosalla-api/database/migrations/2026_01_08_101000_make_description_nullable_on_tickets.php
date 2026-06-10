<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('tickets', 'description')) {
            DB::statement('ALTER TABLE tickets ALTER COLUMN description DROP NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tickets', 'description')) {
            DB::statement('ALTER TABLE tickets ALTER COLUMN description SET NOT NULL');
        }
    }
};
