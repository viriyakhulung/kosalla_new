<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeamGroup;
use App\Models\User;
use Illuminate\Http\Request;

class TeamManagementController extends Controller
{
    public function assignUserToTeam(Request $request)
    {
        $data = $request->validate([
            'team_group_id' => ['required', 'exists:team_groups,id'],
            'user_id'       => ['required', 'exists:users,id'],
            'role'          => ['nullable', 'in:engineer-manager,engineer-staff'],
            'is_active'     => ['nullable', 'boolean'],
        ]);

        $teamGroup = TeamGroup::findOrFail($data['team_group_id']);
        $userId = (int) $data['user_id'];

        $teamGroup->users()->syncWithoutDetaching([
            $userId => [
                'role' => $data['role'] ?? 'engineer-staff',
                'is_active' => $data['is_active'] ?? true,
            ]
        ]);

        return response()->json([
            'message' => 'Assigned successfully',
        ]);
    }
}
