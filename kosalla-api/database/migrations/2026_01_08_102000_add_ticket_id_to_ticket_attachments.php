<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ticket_attachments', function (Blueprint $table) {
            $table->foreignId('ticket_comment_id')
                ->nullable()
                ->after('ticket_id')
                ->constrained('ticket_comments')
                ->nullOnDelete();

            $table->index(['ticket_comment_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('ticket_attachments', function (Blueprint $table) {
            // ✅ drop index dulu baru drop FK+kolom
            $table->dropIndex(['ticket_comment_id', 'created_at']);
            $table->dropConstrainedForeignId('ticket_comment_id');
        });
    }
};
