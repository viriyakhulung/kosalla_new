<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Services\OwnedMasterProductService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PortalAnnouncementController extends Controller
{
    public function __construct(private OwnedMasterProductService $ownedProducts)
    {
    }

    private function resolveOrgId(Request $request): int
    {
        $user = $request->user();

        if (!$user?->organization_id) {
            abort(response()->json(['message' => 'User belum punya organization_id'], 422));
        }

        $orgId = (int) $user->organization_id;

        $roleId = (int) $user->master_role_id;
        if (in_array($roleId, [1, 2], true)) {
            $reqOrg = $request->query('org_id');
            if ($reqOrg) $orgId = (int) $reqOrg;
        }

        return $orgId;
    }

    /**
     * Map product entitlement:
     * inventory_items.name <-> master_products.name (case-insensitive + trim)
     */
    private function ownedMasterProductIds(int $orgId): array
    {
        return $this->ownedProducts->ownedMasterProductIds($orgId);
    }

    private function activeContract(int $orgId)
    {
        $now = now();

        return Contract::query()
            ->where('organization_id', $orgId)
            ->where('status', 'active')
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->orderBy('end_date', 'asc')
            ->first();
    }

    /**
     * GET /api/portal/announcements?per_page=20&include_dismissed=0&org_id=&debug=1
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $orgId = $this->resolveOrgId($request);

        // gate: kontrak harus aktif
        $contract = $this->activeContract($orgId);
        if (!$contract) {
            return response()->json([
                'contract' => [
                    'active' => false,
                    'message' => 'Kontrak organisasi sudah expired atau tidak ada. Hubungi admin untuk perpanjang.',
                ],
                'data' => [],
            ]);
        }

        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 1) $perPage = 20;
        if ($perPage > 100) $perPage = 100;

        $includeDismissed = ((int) $request->query('include_dismissed', 0) === 1);

        $ownedProductIds = $this->ownedMasterProductIds($orgId);
        $now = now();

        $q = DB::table('kb_announcements as a')
            ->leftJoin('kb_announcement_reads as r', function ($join) use ($user) {
                $join->on('r.announcement_id', '=', 'a.id')
                    ->where('r.user_id', '=', $user->id);
            })
            ->leftJoin('master_products as mp', 'mp.id', '=', 'a.product_id')
            ->where('a.status', 'published')
            ->whereNotNull('a.published_at')
            ->where(function ($w) use ($now) {
                $w->whereNull('a.starts_at')->orWhere('a.starts_at', '<=', $now);
            })
            ->where(function ($w) use ($now) {
                $w->whereNull('a.ends_at')->orWhere('a.ends_at', '>=', $now);
            })
            // ✅ filter scope: global OR product yang dimiliki org
            ->where(function ($w) use ($ownedProductIds) {
                $w->where('a.scope', 'global');

                if (!empty($ownedProductIds)) {
                    $w->orWhere(function ($x) use ($ownedProductIds) {
                        $x->where('a.scope', 'product')
                            ->whereIn('a.product_id', $ownedProductIds);
                    });
                }
            })
            ->select([
                'a.id',
                'a.scope',
                'a.product_id',
                'mp.name as product_name',
                'a.title',
                'a.body_html',
                'a.published_at',
                'a.starts_at',
                'a.ends_at',
                DB::raw('r.dismissed_at as dismissed_at'),
            ])
            ->orderByDesc('a.published_at');

        // default: hide dismissed (untuk list)
        if (!$includeDismissed) {
            $q->whereNull('r.dismissed_at');
        }

        $page = $q->paginate($perPage);

        $resp = [
            'contract' => [
                'active' => true,
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'end_date' => $contract->end_date,
            ],
            'data' => $page,
        ];

        // ✅ debug sementara
        if ($request->query('debug')) {
            $resp['debug'] = [
                'org_id' => $orgId,
                'owned_product_ids' => $ownedProductIds,
                'include_dismissed' => $includeDismissed,
                'now' => (string) $now,
            ];
        }

        return response()->json($resp);
    }
}