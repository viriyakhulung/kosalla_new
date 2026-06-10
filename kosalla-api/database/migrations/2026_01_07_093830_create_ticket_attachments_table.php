<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ticket_attachments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->cascadeOnDelete();

            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('original_name', 255);
            $table->string('path', 500); // path di storage (disk public)
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('size')->default(0);

            $table->timestamps();

            $table->index(['ticket_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_attachments');
    }
};
