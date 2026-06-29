<?php

namespace App\Http\Middleware;

use App\Models\Contract;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

        // Cache boolean per-org TTL 60s (disengaja pendek: penonaktifan kontrak bisa
        // lolos ≤60s). Disetujui Viriya — jangan naikkan TTL tanpa konfirmasi.
        $orgId = (int) $user->organization_id;
        $hasActive = Cache::remember("contract_active:{$orgId}", 60, function () use ($orgId) {
            $now = now();
            return Contract::query()
                ->where('organization_id', $orgId)
                ->where('status', 'active')
                ->where('start_date', '<=', $now)
                ->where('end_date', '>=', $now)
                ->exists();
        });

        if (!$hasActive) {
            return response()->json(['message' => 'Kontrak organisasi sudah expired atau tidak ada. Hubungi admin untuk perpanjang.'], 403);
        }

        return $next($request);
    }
}
