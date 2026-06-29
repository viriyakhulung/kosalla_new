<?php

namespace App\Http\Middleware;

use App\Models\MasterRole as MasterRoleModel;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MasterRole
{
    public function handle(Request $request, Closure $next, ...$allowed)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Master data statis → cache map id→name (hindari query relasi tiap request).
        // Jika master role berubah, panggil Cache::forget('master_roles_map').
        $map = Cache::rememberForever('master_roles_map', fn () => MasterRoleModel::pluck('name', 'id')->all());
        $role = $map[$user->master_role_id] ?? null; // setara $user->masterRole?->name
        if (!$role || !in_array($role, $allowed, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
