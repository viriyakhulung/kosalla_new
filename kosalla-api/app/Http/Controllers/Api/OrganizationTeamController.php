<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\TeamGroup;
use Illuminate\Http\Request;

/**
 * organisation_attach_teams — kelola tim yang di-attach ke sebuah organisasi.
 * Dipakai admin untuk menentukan tim mana yang menangani tiket org tertentu.
 */
class OrganizationTeamController extends Controller
{
    // GET /api/admin/organizations/{organization}/teams
    public function index(Organization $organization)
    {
        $attached = $organization->teamGroups()
            ->orderBy('name')
            ->get(['team_groups.id', 'name', 'code', 'is_active']);

        $available = TeamGroup::query()
            ->whereNotIn('id', $attached->pluck('id'))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'is_active']);

        return response()->json([
            'attached'  => $attached,
            'available' => $available,
        ]);
    }

    // POST /api/admin/organizations/{organization}/teams   body: { team_group_id }
    public function store(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'team_group_id' => ['required', 'integer', 'exists:team_groups,id'],
        ]);

        // syncWithoutDetaching → idempoten, tak menggandakan baris pivot.
        $organization->teamGroups()->syncWithoutDetaching([$data['team_group_id']]);

        return response()->json([
            'message'  => 'Tim berhasil di-attach ke organisasi',
            'attached' => $organization->teamGroups()
                ->orderBy('name')
                ->get(['team_groups.id', 'name', 'code', 'is_active']),
        ], 201);
    }

    // DELETE /api/admin/organizations/{organization}/teams/{teamGroup}
    public function destroy(Organization $organization, TeamGroup $teamGroup)
    {
        $organization->teamGroups()->detach($teamGroup->id);

        return response()->json([
            'message' => 'Tim berhasil di-detach dari organisasi',
        ]);
    }
}
