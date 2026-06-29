<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Additive performance indexes for the tickets table (no FK, no cascade, no data change).
 *
 * - tickets_org_team_idx       (organization_id, team_group_id): team-scoped routing/list queries.
 * - tickets_assigned_status_idx (assigned_to, status): "tickets assigned to me", typically status-filtered.
 *
 * Index-only; rolling back drops only these two indexes (non-destructive to data).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->index(['organization_id', 'team_group_id'], 'tickets_org_team_idx');
            $table->index(['assigned_to', 'status'], 'tickets_assigned_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('tickets_org_team_idx');
            $table->dropIndex('tickets_assigned_status_idx');
        });
    }
};
