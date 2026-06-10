<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PortalKbController extends Controller
{
    private function resolveOrgId(Request $request): int
    {
        $user = $request->user();
        $roleId = (int) ($user->master_role_id ?? 0);

        // superadmin (1) wajib tentukan org_id
        if ($roleId === 1) {
            $reqOrg = (int) $request->query('org_id', 0);
            if ($reqOrg <= 0) {
                abort(response()->json([
                    'message' => 'Superadmin wajib memilih org_id (contoh: ?org_id=6)'
                ], 422));
            }
            return $reqOrg;
        }

        if (!$user?->organization_id) {
            abort(response()->json(['message' => 'User belum punya organization_id'], 422));
        }

        $orgId = (int) $user->organization_id;

        // viriyastaff (2) boleh override org via ?org_id=
        if ($roleId === 2) {
            $reqOrg = (int) $request->query('org_id', 0);
            if ($reqOrg > 0) $orgId = $reqOrg;
        }

        return $orgId;
    }

    /**
     * Produk yang dimiliki org (mapping inventory_items.name <-> master_products.name).
     */
    private function ownedMasterProductIds(int $orgId): array
    {
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
    }

    /**
     * GET /api/portal/kb/articles
     * Query:
     * - q, product_id, per_page, page
     * - (optional) org_id untuk internal/superadmin/viriyastaff
     */
    public function index(Request $request)
    {
        $orgId = $this->resolveOrgId($request);

        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $qText = trim((string) $request->query('q', ''));
        $productId = (int) $request->query('product_id', 0);

        $ownedProductIds = $this->ownedMasterProductIds($orgId);

        // kalau org belum punya produk aktif -> kosongkan
        if (empty($ownedProductIds)) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ]);
        }

        $q = DB::table('kb_articles as k')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'k.product_id')
            ->select([
                'k.id',
                'k.product_id',
                DB::raw('mp.name as product_name'),
                'k.title',
                'k.slug',
                'k.status',
                'k.published_at',
                // pastikan FE selalu punya tanggal untuk kolom "Updated"
                DB::raw('COALESCE(k.updated_at, k.published_at, k.created_at) as updated_at'),
            ])
            ->where('k.status', 'published')
            ->whereNotNull('k.published_at')
            ->whereIn('k.product_id', $ownedProductIds);

        if ($productId > 0) {
            $q->where('k.product_id', $productId);
        }

        if ($qText !== '') {
            $q->where('k.title', 'ilike', '%' . $qText . '%');
        }

        $q->orderByDesc('k.published_at');

        return response()->json($q->paginate($perPage));
    }

    /**
     * GET /api/portal/kb/articles/{slug}
     * Portal reader: hanya boleh lihat artikel published + produk dimiliki org.
     */
    public function show(Request $request, string $slug)
    {
        $orgId = $this->resolveOrgId($request);
        $ownedProductIds = $this->ownedMasterProductIds($orgId);

        $row = DB::table('kb_articles as k')
            ->leftJoin('master_products as mp', 'mp.id', '=', 'k.product_id')
            ->where('k.slug', $slug)
            ->where('k.status', 'published')
            ->whereNotNull('k.published_at')
            ->first([
                'k.id',
                'k.product_id',
                DB::raw('mp.name as product_name'),
                'k.title',
                'k.slug',
                'k.body_html',
                'k.applies_to_version',
                'k.status',
                'k.published_at',
                DB::raw('COALESCE(k.updated_at, k.published_at, k.created_at) as updated_at'),
            ]);

        if (!$row) return response()->json(['message' => 'Not found'], 404);

        if (!in_array((int) $row->product_id, $ownedProductIds, true)) {
            return response()->json(['message' => 'Forbidden (product not owned)'], 403);
        }

        return response()->json($row);
    }
}
