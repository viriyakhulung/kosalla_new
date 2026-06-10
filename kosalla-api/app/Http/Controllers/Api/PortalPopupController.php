<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PortalPopupController extends Controller
{
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

    // GET /api/portal/popups/pending?org_id=
    public function pending(Request $request)
    {
        $user = $request->user();
        $orgId = $this->resolveOrgId($request);

        $contract = $this->activeContract($orgId);
        if (!$contract) {
            return response()->json([
                'contract' => [
                    'active' => false,
                    'message' => 'Kontrak organisasi sudah expired atau tidak ada. Hubungi admin untuk perpanjang.',
                ],
                'items' => [],
            ]);
        }

        $items = [];
        $ownedProductIds = $this->ownedMasterProductIds($orgId);
        $now = now();

        /**
         * ✅ Sticky popup announcement:
         * - TIDAK pakai dismissed_at (jadi akan muncul lagi setiap login selama window masih aktif)
         */
        $announcements = DB::table('kb_announcements as a')
            ->where('a.status', 'published')
            ->whereNotNull('a.published_at')
            ->where(function ($w) use ($now) {
                $w->whereNull('a.starts_at')->orWhere('a.starts_at', '<=', $now);
            })
            ->where(function ($w) use ($now) {
                $w->whereNull('a.ends_at')->orWhere('a.ends_at', '>=', $now);
            })
            ->where(function ($w) use ($ownedProductIds) {
                $w->where('a.scope', 'global');
                if (!empty($ownedProductIds)) {
                    $w->orWhere(function ($x) use ($ownedProductIds) {
                        $x->where('a.scope', 'product')
                          ->whereIn('a.product_id', $ownedProductIds);
                    });
                }
            })
            ->orderByDesc('a.published_at')
            ->limit(5)
            ->get([
                'a.id',
                'a.scope',
                'a.product_id',
                'a.title',
                'a.body_html',
                'a.published_at',
                'a.starts_at',
                'a.ends_at',
            ]);

        foreach ($announcements as $a) {
            $items[] = [
                'type' => 'announcement',
                'id' => $a->id,
                'scope' => $a->scope,
                'product_id' => $a->product_id,
                'title' => $a->title,
                'body_html' => $a->body_html,
                'published_at' => $a->published_at,
                'starts_at' => $a->starts_at,
                'ends_at' => $a->ends_at,
            ];
        }

        // 2) Auto contract alert D90/D30 (dismiss sekali per user)
        $end = \Carbon\Carbon::parse($contract->end_date)->startOfDay();
        $daysLeft = now()->startOfDay()->diffInDays($end, false);

        $alertType = null;
        if ($daysLeft <= 30 && $daysLeft >= 0) $alertType = 'D30';
        else if ($daysLeft <= 90 && $daysLeft >= 0) $alertType = 'D90';

        if ($alertType) {
            $dismissed = DB::table('contract_alert_dismissals')
                ->where('contract_id', $contract->id)
                ->where('user_id', $user->id)
                ->where('alert_type', $alertType)
                ->whereNotNull('dismissed_at')
                ->exists();

            if (!$dismissed) {
                $items[] = [
                    'type' => 'contract_alert',
                    'contract_id' => $contract->id,
                    'contract_number' => $contract->contract_number,
                    'end_date' => $contract->end_date,
                    'days_left' => $daysLeft,
                    'alert_type' => $alertType,
                ];
            }
        }

        return response()->json([
            'contract' => [
                'active' => true,
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'end_date' => $contract->end_date,
            ],
            'items' => $items,
        ]);
    }

    // POST /api/portal/announcements/{id}/dismiss
    // NOTE: untuk sticky popup, endpoint ini boleh tetap ada (tidak dipakai popup).
    public function dismissAnnouncement(Request $request, int $id)
    {
        $user = $request->user();

        DB::table('kb_announcement_reads')->updateOrInsert(
            ['announcement_id' => $id, 'user_id' => $user->id],
            ['dismissed_at' => now(), 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['message' => 'OK']);
    }

    // POST /api/portal/contracts/{contractId}/dismiss  body: { "alert_type": "D90"|"D30" }
    public function dismissContractAlert(Request $request, int $contractId)
    {
        $user = $request->user();

        $data = $request->validate([
            'alert_type' => 'required|in:D90,D30',
        ]);

        DB::table('contract_alert_dismissals')->updateOrInsert(
            ['contract_id' => $contractId, 'user_id' => $user->id, 'alert_type' => $data['alert_type']],
            ['dismissed_at' => now(), 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['message' => 'OK']);
    }
}