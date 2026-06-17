<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminUser\StoreUserRequest;
use App\Http\Requests\AdminUser\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $role   = trim((string) $request->query('role', ''));

        $users = User::query()
            ->with(['organization', 'location', 'masterRole'])
            ->when($search !== '', function ($q) use ($search) {
                // PostgreSQL: ilike = case-insensitive
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->when($role !== '', function ($q) use ($role) {
                // filter berdasarkan nama role di tabel master_roles
                $q->whereHas('masterRole', function ($sub) use ($role) {
                    $sub->where('name', $role);
                });
            })
            ->latest()
            ->paginate(50)
            ->withQueryString();

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
