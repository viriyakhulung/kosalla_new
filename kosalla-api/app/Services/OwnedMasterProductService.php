<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Resolusi "produk yang dimiliki org": mapping nama inventory_items <-> master_products
 * (case-insensitive + trim). Logika query identik dengan implementasi inline lama di
 * PortalKb/PortalUserArticle/PortalAnnouncement/PortalPopup controller.
 *
 * Optimasi (additive, tanpa ubah hasil):
 * - Memoize per-request (instance di-inject via constructor → satu instance per request).
 * - Cache lintas-request TTL 300s per-org (key di-scope per org → tidak bocor lintas-org).
 *
 * Catatan staleness: perubahan kepemilikan produk bisa stale ≤5 menit di portal.
 * Untuk invalidasi instan saat mutasi inventory/Team PIC, panggil forget($orgId).
 */
class OwnedMasterProductService
{
    /** @var array<int, int[]> memoize per-request: [orgId => ids] */
    private array $memo = [];

    /**
     * @return int[] daftar master_product.id yang dimiliki org.
     */
    public function ownedMasterProductIds(int $orgId): array
    {
        if (array_key_exists($orgId, $this->memo)) {
            return $this->memo[$orgId];
        }

        $ids = Cache::remember("owned_mpids:{$orgId}", 300, function () use ($orgId) {
            return DB::table('master_products as mp')
                ->join('inventory_items as ii', function ($join) {
                    $join->whereRaw("LOWER(TRIM(ii.name)) = LOWER(TRIM(mp.name))");
                })
                ->where('ii.organization_id', $orgId)
                ->where('ii.is_active', true)
                ->distinct()
                ->pluck('mp.id')
                ->map(fn ($v) => (int) $v)
                ->values()
                ->all();
        });

        return $this->memo[$orgId] = $ids;
    }

    /**
     * Invalidasi cache lintas-request untuk satu org (opsional, dipanggil saat mutasi).
     */
    public function forget(int $orgId): void
    {
        unset($this->memo[$orgId]);
        Cache::forget("owned_mpids:{$orgId}");
    }
}
