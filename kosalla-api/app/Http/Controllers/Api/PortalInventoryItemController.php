<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class PortalInventoryItemController extends Controller
{
    /**
     * GET /api/portal/inventory-items
     * Return daftar inventory items untuk organisasi user (custstaff/viriyastaff/superadmin).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user?->organization_id) {
            return response()->json(['message' => 'User belum punya organization_id'], 422);
        }

        $items = InventoryItem::query()
            ->where('organization_id', $user->organization_id)
            ->where(function ($q) use ($request) {
                // optional filter active (default true jika ada kolom is_active)
                if ($request->filled('active')) {
                    $q->where('is_active', (bool) $request->boolean('active'));
                }
            })
            ->orderBy('name')
            ->get(['id', 'name', 'organization_id']);

        return response()->json(['data' => $items]);
    }
}
