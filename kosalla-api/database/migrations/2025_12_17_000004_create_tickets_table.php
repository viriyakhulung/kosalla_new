<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();

            // multi-tenant scope
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->restrictOnDelete();

            // product dari admin inventory (opsi A)
            $table->foreignId('inventory_item_id')
                ->constrained('inventory_items')
                ->restrictOnDelete();

            // lokasi (kalau belum siap, set nullable dulu)
            $table->foreignId('location_id')
                ->nullable()
                ->constrained('locations')
                ->restrictOnDelete();

            // siapa yang membuat ticket
            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            // nomor ticket otomatis (unik per organisasi)
            $table->string('ticket_number', 50);

            // form ringkas
            $table->string('subject', 200);

            // mindmap: Issue Details hanya Description (WYSIWYG)
            $table->longText('description_html');

            // enum sederhana (string biar fleksibel)
            $table->string('priority', 20)->default('normal');  // low|normal|high
            $table->string('status', 30)->default('open');      // open|in_progress|resolved|closed

            // opsional (boleh keep atau drop)
            $table->string('tagging_word', 100)->nullable();
            $table->date('requested_resolution_date')->nullable();

            $table->timestamps();

            // indexes
            $table->unique(['organization_id', 'ticket_number']);
            $table->index(['organization_id', 'status', 'created_at']);
            $table->index(['organization_id', 'location_id', 'created_at']);
            $table->index(['created_by', 'created_at']);
            $table->index(['inventory_item_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
