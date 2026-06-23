<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductHandlerService;
use Illuminate\Http\Request;

class PortalProductTeamLeadController extends Controller
{
    public function __construct(private ProductHandlerService $service) {}

    /**
     * GET /api/portal/product-team-lead?inventory_item_id={id}
     *
     * Resolusi Handler (Team Lead) dari produk terpilih untuk org user login.
     * Mengembalikan { data: { team_group_id, team_group_name, lead } } atau
     * { data: null } bila tidak ada mapping / org tak attach / dst.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user?->organization_id) {
            return response()->json(['data' => null]);
        }

        $inventoryItemId = (int) $request->query('inventory_item_id', 0);
        if ($inventoryItemId <= 0) {
            return response()->json(['data' => null]);
        }

        $result = $this->service->resolve($inventoryItemId, (int) $user->organization_id);

        return response()->json(['data' => $result]);
    }
}
