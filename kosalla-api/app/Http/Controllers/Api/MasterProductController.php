<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterProduct;
use App\Models\TeamGroup;
use Illuminate\Http\Request;

class MasterProductController extends Controller
{
    /**
     * ✅ ADMIN: list master products (paginated)
     * Route: /api/admin/master-products
     */
    public function index()
    {
        return MasterProduct::query()
            ->with('teamGroup:id,name')
            ->orderBy('name')
            ->paginate(50);
    }

    /**
     * ✅ PORTAL: list for dropdown (read-only, active only)
     * Route: /api/portal/master-products
     */
    public function portalIndex(Request $request)
    {
        $items = MasterProduct::query()
            ->select(['id', 'name', 'product_type'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:master_products,name'],
            'product_type' => ['required', 'string', 'max:30'],
            'is_active' => ['nullable', 'boolean'],
            // Team PIC (mapping 1:1) — TANPA exists: (integritas app-layer).
            'team_group_id' => ['nullable', 'integer'],
        ]);

        if (array_key_exists('team_group_id', $data) && $data['team_group_id'] !== null
            && !$this->isValidTeamGroup((int) $data['team_group_id'])) {
            return $this->invalidTeamResponse();
        }

        $data['is_active'] = $request->boolean('is_active', true);

        return response()->json(
            MasterProduct::create($data),
            201
        );
    }

    public function update(Request $request, MasterProduct $masterProduct)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150', 'unique:master_products,name,' . $masterProduct->id],
            'product_type' => ['sometimes', 'string', 'max:30'],
            'is_active' => ['nullable', 'boolean'],
            // Team PIC (mapping 1:1) — TANPA exists: (integritas app-layer).
            // null = lepas mapping ("belum diset").
            'team_group_id' => ['sometimes', 'nullable', 'integer'],
        ]);

        if ($request->has('team_group_id') && $request->input('team_group_id') !== null
            && !$this->isValidTeamGroup((int) $request->input('team_group_id'))) {
            return $this->invalidTeamResponse();
        }

        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $masterProduct->update($data);
        return $masterProduct->load('teamGroup:id,name');
    }

    public function destroy(MasterProduct $masterProduct)
    {
        $masterProduct->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    /**
     * Validasi app-layer (pengganti rule exists:) — team harus ada & aktif.
     */
    private function isValidTeamGroup(int $teamGroupId): bool
    {
        return TeamGroup::where('id', $teamGroupId)
            ->where('is_active', true)
            ->exists();
    }

    private function invalidTeamResponse()
    {
        return response()->json([
            'message' => 'Team PIC tidak valid (harus team aktif).',
            'errors'  => ['team_group_id' => ['Team PIC tidak valid.']],
        ], 422);
    }
}
