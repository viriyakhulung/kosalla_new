<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryItem\StoreInventoryItemRequest;
use App\Http\Requests\InventoryItem\UpdateInventoryItemRequest;
use App\Models\InventoryItem;
use App\Models\Organization;
use App\Models\MasterProduct;
use App\Services\OwnedMasterProductService;

class InventoryItemController extends Controller
{
    public function __construct(private OwnedMasterProductService $ownedProducts)
    {
    }

    public function index(Organization $organization)
    {
        return $organization->inventoryItems()
            ->latest()
            ->paginate(50);
    }

    public function store(StoreInventoryItemRequest $request, Organization $organization)
    {
        $master = MasterProduct::findOrFail($request->master_product_id);

        // unique per org berdasarkan master_product_id
        $exists = $organization->inventoryItems()
            ->where('master_product_id', $master->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Produk sudah ada di organisasi ini'], 422);
        }

        $item = $organization->inventoryItems()->create([
            'master_product_id' => $master->id,
            'name' => $master->name,
            'product_type' => $master->product_type,
            'is_active' => $request->boolean('is_active', true),
        ]);

        // Kepemilikan produk org berubah → segarkan cache owned_mpids org ini.
        $this->ownedProducts->forget((int) $organization->id);

        return response()->json($item, 201);
    }

    public function show(InventoryItem $inventoryItem)
    {
        return $inventoryItem->load('organization');
    }

    public function update(UpdateInventoryItemRequest $request, InventoryItem $inventoryItem)
    {
        $data = $request->validated();

        if ($request->filled('master_product_id')) {
            $master = MasterProduct::findOrFail($request->master_product_id);

            $exists = InventoryItem::where('organization_id', $inventoryItem->organization_id)
                ->where('master_product_id', $master->id)
                ->where('id', '!=', $inventoryItem->id)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'Produk sudah ada di organisasi ini'], 422);
            }

            $data['name'] = $master->name;
            $data['product_type'] = $master->product_type;
        }

        $inventoryItem->update($data);

        // Kepemilikan produk org bisa berubah (master_product_id / is_active) →
        // segarkan cache owned_mpids. organization_id item immutable (tak ada di
        // UpdateInventoryItemRequest) → cukup satu org.
        $this->ownedProducts->forget((int) $inventoryItem->organization_id);

        return $inventoryItem->fresh()->load('organization');
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        // Cegah hapus jika masih dipakai di tickets
        $inUse = $inventoryItem->tickets()->exists() ?? false;
        if ($inUse) {
            return response()->json([
                'message' => 'Inventory item tidak bisa dihapus karena masih digunakan di tiket',
            ], 422);
        }

        $orgId = (int) $inventoryItem->organization_id;
        $inventoryItem->delete();

        // Kepemilikan produk org berubah → segarkan cache owned_mpids org ini.
        $this->ownedProducts->forget($orgId);

        return response()->json(['message' => 'Inventory item deleted']);
    }
}
