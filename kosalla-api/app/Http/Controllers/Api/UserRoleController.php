<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\SetEngineerRoleRequest;
use App\Models\User;

class UserRoleController extends Controller
{
    public function setEngineerRole(SetEngineerRoleRequest $request, User $user)
    {
        $role = $request->validated('role'); // engineer-manager / engineer-staff

        $user->syncRoles([$role]);

        return response()->json([
            'message' => 'Role updated',
            'user_id' => $user->id,
            'roles' => $user->getRoleNames(),
        ]);
    }
}
