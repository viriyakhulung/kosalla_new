<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\TeamGroup;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Resolusi Handler (Team Lead) berdasarkan PRODUK yang dipilih di tiket.
 *
 * Rantai: inventory_item → master_product.team_group_id (team PIC) → cek
 * interseksi org reporter ter-attach ke team itu → Team Lead aktif team itu.
 *
 * Dipakai bersama oleh PortalProductTeamLeadController (resolve untuk FE)
 * dan PortalTicketController::store (guard server saat simpan assigned_to).
 *
 * Semua integritas dijaga di application layer (no FK/exists), sesuai policy.
 */
class ProductHandlerService
{
    /**
     * Resolusi team PIC untuk sebuah inventory item, dengan syarat:
     * - inventory item milik organisasi $orgId,
     * - punya master_product_id,
     * - master_product punya team_group_id (team aktif),
     * - org $orgId ter-attach ke team itu (organization_team_groups).
     *
     * @return TeamGroup|null
     */
    public function resolveTeamGroup(int $inventoryItemId, int $orgId): ?TeamGroup
    {
        $item = InventoryItem::query()
            ->where('id', $inventoryItemId)
            ->where('organization_id', $orgId)
            ->first(['id', 'organization_id', 'master_product_id']);

        if (!$item || !$item->master_product_id) {
            return null;
        }

        $teamGroupId = DB::table('master_products')
            ->where('id', $item->master_product_id)
            ->value('team_group_id');

        if (!$teamGroupId) {
            return null;
        }

        // Interseksi: org reporter harus ter-attach ke team PIC.
        $attached = DB::table('organization_team_groups')
            ->where('organization_id', $orgId)
            ->where('team_group_id', $teamGroupId)
            ->exists();

        if (!$attached) {
            return null;
        }

        return TeamGroup::query()
            ->where('id', $teamGroupId)
            ->where('is_active', true)
            ->first(['id', 'name']);
    }

    /**
     * Team Lead aktif dari sebuah team group, atau null.
     */
    public function resolveLead(TeamGroup $teamGroup): ?User
    {
        return $teamGroup->users()
            ->wherePivot('role', 'team-lead')
            ->wherePivot('is_active', true)
            ->first(['users.id', 'users.name', 'users.email']);
    }

    /**
     * Bentuk hasil resolve untuk FE: { team_group_id, team_group_name, lead } | null.
     *
     * @return array{team_group_id:int,team_group_name:string,lead:?array{id:int,name:string,email:?string}}|null
     */
    public function resolve(int $inventoryItemId, int $orgId): ?array
    {
        $team = $this->resolveTeamGroup($inventoryItemId, $orgId);
        if (!$team) {
            return null;
        }

        $lead = $this->resolveLead($team);

        return [
            'team_group_id'   => (int) $team->id,
            'team_group_name' => $team->name,
            'lead'            => $lead ? [
                'id'    => (int) $lead->id,
                'name'  => $lead->name,
                'email' => $lead->email,
            ] : null,
        ];
    }

    /**
     * Guard server: apakah $userId benar Team Lead aktif dari team PIC produk
     * $inventoryItemId (untuk org $orgId)? Dipakai saat store ticket.
     */
    public function isValidHandlerForProduct(int $userId, int $inventoryItemId, int $orgId): bool
    {
        $team = $this->resolveTeamGroup($inventoryItemId, $orgId);
        if (!$team) {
            return false;
        }

        return $team->users()
            ->where('users.id', $userId)
            ->wherePivot('role', 'team-lead')
            ->wherePivot('is_active', true)
            ->exists();
    }
}
