<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('master_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique(); // superadmin, viriyastaff, custstaff
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_roles');
    }
};
