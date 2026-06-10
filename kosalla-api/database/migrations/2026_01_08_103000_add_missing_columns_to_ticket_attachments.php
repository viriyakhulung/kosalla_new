<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ticket_attachments', function (Blueprint $table) {
            if (!Schema::hasColumn('ticket_attachments', 'original_name')) {
                $table->string('original_name', 255)->after('uploaded_by');
            }
            if (!Schema::hasColumn('ticket_attachments', 'path')) {
                $table->string('path', 500)->after('original_name');
            }
            if (!Schema::hasColumn('ticket_attachments', 'mime_type')) {
                $table->string('mime_type', 150)->nullable()->after('path');
            }
            if (!Schema::hasColumn('ticket_attachments', 'size')) {
                $table->unsignedBigInteger('size')->default(0)->after('mime_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ticket_attachments', function (Blueprint $table) {
            $drops = [];
            foreach (['original_name', 'path', 'mime_type', 'size'] as $col) {
                if (Schema::hasColumn('ticket_attachments', $col)) {
                    $drops[] = $col;
                }
            }
            if (!empty($drops)) {
                $table->dropColumn($drops);
            }
        });
    }
};
