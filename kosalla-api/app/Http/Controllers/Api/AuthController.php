<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // Login Function: Authenticates the user and returns a token
    public function login(LoginRequest $request)
    {
        // Find user by email
        $user = User::where('email', $request->email)->first();

        // Check if user exists and password matches
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        // Generate token for the user
        $token = $user->createToken($request->device_name ?? 'api')->plainTextToken;

        // Return token and user data
        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    // Logout Function: Logs the user out by deleting their token
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out']);
    }

    // Me Function: Returns the authenticated user's data
    public function me(Request $request)
    {
        \Log::info('[AUTH ME]', [
            'user_id' => optional($request->user())->id,
        ]);

        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    /**
     * ✅ Change Password (Reset Password dari Profile)
     * Request body:
     * - current_password
     * - password
     * - password_confirmation
     */
    public function changePassword(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],

            // ✅ Password baru wajib policy baru + confirmed
            'password' => [
                'required',
                'string',
                'confirmed', // butuh password_confirmation
                Password::min(8)
                    ->mixedCase() // huruf besar + kecil
                    ->numbers()   // angka
                    ->symbols(),  // simbol
            ],
        ], [
            'password.confirmed' => 'Konfirmasi password tidak sama.',
        ]);

        $user = $request->user();

        // cek current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password salah.'],
            ]);
        }

        // update password baru
        $user->password = Hash::make($validated['password']);
        $user->save();

        // ✅ revoke semua token (logout semua device)
        $user->tokens()->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Password berhasil diubah. Silakan login ulang.',
        ]);
    }

    // Helper Function: Returns detailed user data including roles, permissions, etc.
    private function userPayload(User $user): array
    {
        // Pastikan relasi diload
        $user->load(['organization', 'location', 'teamGroups', 'masterRole']);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,

            // ✅ master role (ini yang dipakai FE)
            'master_role_id' => $user->master_role_id,
            'master_role' => $user->masterRole?->name,

            'can_create'  => (bool) $user->can_create,
            'can_review'  => (bool) $user->can_review,
            'can_publish' => (bool) $user->can_publish,
            'organization_id' => $user->organization_id,

            // optional (kalau nanti pakai spatie lagi)
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),

            'organization' => $user->organization,
            'location' => $user->location,

            // 👇 Mapping Pivot
            'team_groups' => $user->teamGroups->map(function ($tg) {
                return [
                    'id' => $tg->id,
                    'name' => $tg->name,
                    'code' => $tg->code,
                    'is_active' => $tg->is_active,
                    // Ambil data jabatan & status dari tabel pivot
                    'role' => $tg->pivot->role ?? null,
                    'member_active' => $tg->pivot->is_active ?? null,
                ];
            }),
        ];
    }
}
