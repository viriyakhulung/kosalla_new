<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterProduct;
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
        ]);

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
        ]);

        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $masterProduct->update($data);
        return $masterProduct;
    }

    public function destroy(MasterProduct $masterProduct)
    {
        $masterProduct->delete();
        return response()->json(['message' => 'Product deleted']);
    }
}
