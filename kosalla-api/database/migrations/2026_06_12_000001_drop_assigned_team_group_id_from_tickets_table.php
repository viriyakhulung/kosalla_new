<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Hapus kolom legacy `assigned_team_group_id` pada tabel `tickets`.
 *
 * Kolom ini duplikat dari `team_group_id` (silsilah skema lama). Kolom kanonik
 * adalah `team_group_id` (dipakai model Ticket, TicketRoutingService,
 * PortalTicketController, dan types FE). Datanya kosong saat migrasi dibuat,
 * tapi tetap dipindahkan defensif sebelum drop.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('tickets', 'assigned_team_group_id')) {
            // Pindahkan sisa data (jika ada) ke kolom kanonik yang masih kosong.
            DB::statement(
                'UPDATE tickets SET team_group_id = assigned_team_group_id
                 WHERE team_group_id IS NULL AND assigned_team_group_id IS NOT NULL'
            );

            // Postgres otomatis melepas index & foreign key milik kolom saat di-drop.
            DB::statement('ALTER TABLE tickets DROP COLUMN IF EXISTS assigned_team_group_id');
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('tickets', 'assigned_team_group_id')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->foreignId('assigned_team_group_id')
                    ->nullable()
                    ->after('team_group_id')
                    ->constrained('team_groups')
                    ->nullOnDelete();
            });
        }
    }
};
