<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('ticket_number', 80)->unique()->after('id');
        });
    }
    public function down(): void {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('ticket_number');
        });
    }
};

