<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminUser\StoreUserRequest;
use App\Http\Requests\AdminUser\UpdateUserRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->with(['organization', 'location', 'masterRole'])
            ->latest()
            ->paginate(50);

        return $users;
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'organization_id' => $data['organization_id'],
            'location_id' => $data['location_id'] ?? null,
            'master_role_id' => $data['master_role_id'],
        ]);

        return response()->json(
            $user->load(['organization','location','masterRole']),
            201
        );
    }

    public function show(User $user)
    {
        return $user->load(['organization','location','masterRole']);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        $payload = [
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'organization_id' => $data['organization_id'] ?? $user->organization_id,
            'location_id' => array_key_exists('location_id', $data) ? $data['location_id'] : $user->location_id,
            'master_role_id' => $data['master_role_id'] ?? $user->master_role_id,
        ];

        if (!empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user->update($payload);

        return $user->load(['organization','location','masterRole']);
    }

    public function destroy(User $user)
    {
        // optional: larang hapus superadmin terakhir
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}
