<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeamGroup;
use App\Models\TeamGroupUser;
use App\Models\User;
use Illuminate\Http\Request;

class TeamMemberController extends Controller
{
    public function index(TeamGroup $teamGroup)
    {
        $members = $teamGroup->users()
            ->select('users.id', 'users.name', 'users.email', 'users.master_role_id', 'users.organization_id', 'users.location_id')
            ->orderBy('users.name')
            ->get()
            ->map(fn ($u) => [
                'id'              => $u->id,
                'name'            => $u->name,
                'email'           => $u->email,
                'master_role_id'  => $u->master_role_id,
                'organization_id' => $u->organization_id,
                'location_id'     => $u->location_id,
                'role'            => $u->pivot->role ?? 'engineer-staff',
                'is_active'       => (bool) ($u->pivot->is_active ?? true),
            ]);

        return response()->json([
            'team_group' => [
                'id'   => $teamGroup->id,
                'name' => $teamGroup->name,
                'code' => $teamGroup->code,
            ],
            'members' => $members,
        ]);
    }

    public function store(Request $request, TeamGroup $teamGroup)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role'    => ['nullable', 'string', 'in:' . implode(',', TeamGroupUser::VALID_ROLES)],
        ]);

        $userId = (int) $validated['user_id'];
        $role   = $validated['role'] ?? 'engineer-staff';

        // Guard keamanan (app-layer): hanya staf internal vendor (superadmin/
        // viriyastaff = master_role 1/2) yang boleh jadi anggota team. Mencegah
        // custstaff masuk team → menutup jalur kebocoran notifikasi lintas-tenant.
        $candidate = User::select('id', 'master_role_id')->find($userId);
        if (!$candidate || !in_array((int) $candidate->master_role_id, [1, 2], true)) {
            return response()->json([
                'message' => 'Hanya staf internal (superadmin/viriyastaff) yang boleh menjadi anggota team.',
                'errors'  => ['user_id' => ['User bukan staf internal.']],
            ], 422);
        }

        $teamGroup->users()->syncWithoutDetaching([
            $userId => ['role' => $role, 'is_active' => true],
        ]);

        return response()->json(['message' => 'Member added']);
    }

    public function update(Request $request, TeamGroup $teamGroup, User $user)
    {
        $validated = $request->validate([
            'role'      => ['nullable', 'string', 'in:' . implode(',', TeamGroupUser::VALID_ROLES)],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!$teamGroup->users()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'User is not a member of this team group'], 404);
        }

        $pivot = [];
        if (array_key_exists('role', $validated) && $validated['role'] !== null) {
            $pivot['role'] = $validated['role'];
        }
        if (array_key_exists('is_active', $validated) && $validated['is_active'] !== null) {
            $pivot['is_active'] = (bool) $validated['is_active'];
        }

        if (!empty($pivot)) {
            $teamGroup->users()->updateExistingPivot($user->id, $pivot);
        }

        return response()->json(['message' => 'Member updated']);
    }

    public function destroy(TeamGroup $teamGroup, User $user)
    {
        $teamGroup->users()->detach($user->id);

        return response()->json(['message' => 'Member removed']);
    }

    public function users()
    {
        $users = User::query()
            ->select('id', 'name', 'email', 'organization_id', 'location_id', 'master_role_id')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $users]);
    }
}
