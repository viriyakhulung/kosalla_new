<?php

namespace App\Http\Middleware;

use App\Models\Contract;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveContract
{
    /**
     * Pastikan organisasi punya kontrak aktif (end_date >= today, status active).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user?->organization_id) {
            return response()->json(['message' => 'User tidak memiliki organization.'], 403);
        }

        $now = now();
        $hasActive = Contract::query()
            ->where('organization_id', $user->organization_id)
            ->where('status', 'active')
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->exists();

        if (!$hasActive) {
            return response()->json(['message' => 'Kontrak organisasi sudah expired atau tidak ada. Hubungi admin untuk perpanjang.'], 403);
        }

        return $next($request);
    }
}
