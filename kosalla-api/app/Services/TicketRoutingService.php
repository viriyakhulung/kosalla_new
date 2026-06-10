<?php

namespace App\Services;

use App\Models\TeamGroup;

class TicketRoutingService
{
    /**
     * Cari team_group_id yang menangani category ini.
     * Org-specific diprioritaskan di atas global (organization_id IS NULL).
     * Return null kalau tidak ada match.
     */
    public function resolveTeamGroup(?string $category, ?int $organizationId): ?int
    {
        if (!$category || trim($category) === '') {
            return null;
        }

        $teamGroup = TeamGroup::query()
            ->where('is_active', true)
            ->whereRaw('LOWER(handles_category) = ?', [strtolower(trim($category))])
            ->where(function ($q) use ($organizationId) {
                $q->where('organization_id', $organizationId)
                  ->orWhereNull('organization_id');
            })
            // org-specific (NOT NULL) sebelum global (NULL)
            ->orderByRaw('CASE WHEN organization_id IS NULL THEN 1 ELSE 0 END ASC')
            ->first();

        return $teamGroup?->id;
    }
}
