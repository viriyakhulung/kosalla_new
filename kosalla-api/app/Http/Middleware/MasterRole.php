<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class MasterRole
{
    public function handle(Request $request, Closure $next, ...$allowed)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $role = $user->masterRole?->name; // relasi masterRole
        if (!$role || !in_array($role, $allowed, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
