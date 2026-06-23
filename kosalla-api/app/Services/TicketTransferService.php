<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\TeamGroup;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Logika transfer/lempar tiket ke team group lain (organisasi sama).
 * Yang berubah hanya assigned_to (→ Team Lead aktif team tujuan);
 * team_group_id TETAP. Integritas dijaga di application layer (no FK/exists).
 *
 * Dipakai bersama oleh PortalTicketTransferController (targets + transfer)
 * dan PortalTicketController::show (flag can_transfer).
 *
 * CATATAN PENTING: tiket yang dibuat lewat portal TIDAK mengisi team_group_id —
 * "tim yang menangani" diturunkan dari handler (assigned_to) yang berstatus
 * Team Lead. Maka "current handling team" = team tempat assigned_to menjadi
 * team-lead aktif (fallback bila ticket.team_group_id null).
 */
class TicketTransferService
{
    /**
     * ID team yang saat ini menangani tiket.
     * - Jika ticket.team_group_id terisi → pakai itu.
     * - Selain itu → team(s) di mana handler (assigned_to) jadi team-lead aktif.
     *
     * @return array<int,int>
     */
    public function currentHandlingTeamIds(Ticket $ticket): array
    {
        if ($ticket->team_group_id) {
            return [(int) $ticket->team_group_id];
        }

        if (!$ticket->assigned_to) {
            return [];
        }

        return DB::table('team_group_user')
            ->where('user_id', $ticket->assigned_to)
            ->where('role', 'team-lead')
            ->where('is_active', true)
            ->pluck('team_group_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Nama team penanganan saat ini (gabungan bila >1), untuk audit & email.
     */
    public function currentHandlingTeamName(Ticket $ticket): string
    {
        $ids = $this->currentHandlingTeamIds($ticket);
        if (empty($ids)) {
            return '-';
        }

        $names = TeamGroup::whereIn('id', $ids)->orderBy('name')->pluck('name')->all();

        return empty($names) ? '-' : implode(', ', $names);
    }

    /**
     * Apakah $user berwenang melempar $ticket?
     * - superadmin (1): boleh (pola internal).
     * - viriyastaff (2): harus team-lead aktif di salah satu team penanganan
     *   saat ini (lihat currentHandlingTeamIds).
     * - selain itu: tidak.
     */
    public function canTransfer(User $user, Ticket $ticket): bool
    {
        $roleId = (int) $user->master_role_id;

        if ($roleId === 1) {
            return true;
        }

        if ($roleId !== 2) {
            return false;
        }

        $handlingIds = $this->currentHandlingTeamIds($ticket);
        if (empty($handlingIds)) {
            return false;
        }

        return $user->teamGroups()
            ->whereIn('team_groups.id', $handlingIds)
            ->wherePivot('role', 'team-lead')
            ->wherePivot('is_active', true)
            ->exists();
    }

    /**
     * Daftar team tujuan: team aktif yang ter-attach ke organisasi tiket,
     * EXCLUDE team penanganan saat ini. Tiap item disertai flag has_lead.
     *
     * @return array<int, array{id:int,name:string,has_lead:bool}>
     */
    public function targetsFor(Ticket $ticket): array
    {
        $org = Organization::find($ticket->organization_id);
        if (!$org) {
            return [];
        }

        $excludeIds = $this->currentHandlingTeamIds($ticket);

        $teams = $org->teamGroups()
            ->where('team_groups.is_active', true)
            ->when(
                !empty($excludeIds),
                fn ($q) => $q->whereNotIn('team_groups.id', $excludeIds)
            )
            ->with(['users' => function ($q) {
                $q->wherePivot('role', 'team-lead')
                  ->wherePivot('is_active', true)
                  ->select('users.id');
            }])
            ->orderBy('team_groups.name')
            ->get(['team_groups.id', 'team_groups.name']);

        return $teams->map(fn ($t) => [
            'id'       => (int) $t->id,
            'name'     => $t->name,
            'has_lead' => $t->users->isNotEmpty(),
        ])->values()->all();
    }

    /**
     * Validasi team tujuan: harus ada, aktif, se-organisasi dengan tiket,
     * dan BUKAN team penanganan saat ini. Return TeamGroup atau null jika tidak valid.
     */
    public function resolveValidTarget(Ticket $ticket, int $toTeamGroupId): ?TeamGroup
    {
        if (in_array($toTeamGroupId, $this->currentHandlingTeamIds($ticket), true)) {
            return null;
        }

        $toTeam = TeamGroup::find($toTeamGroupId);
        if (!$toTeam || !$toTeam->is_active) {
            return null;
        }

        $attached = DB::table('organization_team_groups')
            ->where('organization_id', $ticket->organization_id)
            ->where('team_group_id', $toTeam->id)
            ->exists();

        return $attached ? $toTeam : null;
    }

    /**
     * Team Lead aktif dari team tujuan, atau null jika tidak ada.
     */
    public function resolveLead(TeamGroup $toTeam): ?User
    {
        return $toTeam->users()
            ->wherePivot('role', 'team-lead')
            ->wherePivot('is_active', true)
            ->first();
    }
}
