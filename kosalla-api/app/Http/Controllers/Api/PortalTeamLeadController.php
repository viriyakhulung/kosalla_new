<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;

class PortalTeamLeadController extends Controller
{
    /**
     * GET /api/portal/team-leads
     *
     * Daftar Team Lead untuk organisasi user yang sedang login.
     * Sumber: team yang ter-attach ke organisasi (organization_team_groups,
     * team aktif) → member dengan pivot role='team-lead' & is_active=true.
     *
     * Dedup by user_id: satu user bisa team-lead di >1 team yang ter-attach
     * ke org yang sama → ditampilkan sekali, nama team digabung.
     *
     * Org tanpa Team Lead → return [] (bukan error).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user?->organization_id) {
            return response()->json(['data' => []]);
        }

        $org = Organization::find($user->organization_id);
        if (!$org) {
            return response()->json(['data' => []]);
        }

        // Team aktif yang ter-attach ke organisasi ini, lengkap dengan
        // member ber-role team-lead yang aktif.
        $teams = $org->teamGroups()
            ->where('team_groups.is_active', true)
            ->with(['users' => function ($q) {
                $q->wherePivot('role', 'team-lead')
                  ->wherePivot('is_active', true)
                  ->select('users.id', 'users.name', 'users.email');
            }])
            ->get(['team_groups.id', 'team_groups.name']);

        // Gabungkan member lintas-team, dedup by user_id.
        $leads = [];
        foreach ($teams as $team) {
            foreach ($team->users as $u) {
                if (!isset($leads[$u->id])) {
                    $leads[$u->id] = [
                        'id'    => $u->id,
                        'name'  => $u->name,
                        'email' => $u->email,
                        'teams' => [],
                    ];
                }
                $leads[$u->id]['teams'][] = $team->name;
            }
        }

        $data = array_map(function ($lead) {
            $teamNames = array_values(array_unique($lead['teams']));
            return [
                'id'              => $lead['id'],
                'name'            => $lead['name'],
                'email'           => $lead['email'],
                'team_group_name' => implode(', ', $teamNames),
            ];
        }, array_values($leads));

        // Urutkan by nama untuk tampilan konsisten.
        usort($data, fn ($a, $b) => strcasecmp($a['name'], $b['name']));

        return response()->json(['data' => $data]);
    }
}
