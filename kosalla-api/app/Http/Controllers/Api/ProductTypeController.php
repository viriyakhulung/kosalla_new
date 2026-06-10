<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductType\StoreProductTypeRequest;
use App\Http\Requests\ProductType\UpdateProductTypeRequest;
use App\Models\ProductType;
use Illuminate\Http\Request;

class ProductTypeController extends Controller
{
    public function index(Request $request)
    {
        $q = ProductType::query()->with('organization');

        if ($request->filled('organization_id')) {
            $q->where('organization_id', $request->integer('organization_id'));
        }

        return $q->latest()->paginate(50);
    }

    public function store(StoreProductTypeRequest $request)
    {
        $data = $request->validated();

        // enforce unique per org
        $exists = ProductType::where('organization_id', $data['organization_id'])
            ->where('code', $data['code'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Code already exists for this organization'], 422);
        }

        $pt = ProductType::create($data);
        return response()->json($pt->load('organization'), 201);
    }

    public function show(ProductType $productType)
    {
        return $productType->load('organization');
    }

    public function update(UpdateProductTypeRequest $request, ProductType $productType)
    {
        $data = $request->validated();

        // kalau code/org berubah, cek unique
        $orgId = $data['organization_id'] ?? $productType->organization_id;
        $code  = $data['code'] ?? $productType->code;

        $exists = ProductType::where('organization_id', $orgId)
            ->where('code', $code)
            ->where('id', '!=', $productType->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Code already exists for this organization'], 422);
        }

        $productType->update($data);
        return $productType->load('organization');
    }

    public function destroy(ProductType $productType)
    {
        $productType->delete();
        return response()->json(['message' => 'Product type deleted']);
    }
}
