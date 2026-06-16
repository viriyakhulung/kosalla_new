<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Cabang per organisasi (anak-org). Pola jiplak LocationController:
 * route-model binding + $organization->branches()->create().
 * Auth: route group sudah dijaga middleware master_role:superadmin.
 */
class BranchController extends Controller
{
    // GET /api/admin/organizations/{organization}/branches
    public function index(Organization $organization)
    {
        $branches = $organization->branches()
            ->withCount('locations')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $branches]);
    }

    // POST /api/admin/organizations/{organization}/branches
    public function store(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:200'],
            'code'    => [
                'nullable', 'string', 'max:50',
                Rule::unique('branches', 'code')->where('organization_id', $organization->id),
            ],
            'address' => ['nullable', 'string'],
            'status'  => ['nullable', Rule::in(Branch::STATUSES)],
        ]);

        $branch = $organization->branches()->create([
            'name'    => $data['name'],
            'code'    => $data['code'] ?? null,
            'address' => $data['address'] ?? null,
            'status'  => $data['status'] ?? Branch::STATUS_ACTIVE,
        ]);

        return response()->json(['data' => $branch], 201);
    }

    // GET /api/admin/branches/{branch}
    public function show(Branch $branch)
    {
        return response()->json(['data' => $branch->loadCount('locations')]);
    }

    // PUT/PATCH /api/admin/branches/{branch}
    public function update(Request $request, Branch $branch)
    {
        $data = $request->validate([
            'name'    => ['sometimes', 'string', 'max:200'],
            'code'    => [
                'nullable', 'string', 'max:50',
                Rule::unique('branches', 'code')
                    ->where('organization_id', $branch->organization_id)
                    ->ignore($branch->id),
            ],
            'address' => ['nullable', 'string'],
            'status'  => ['nullable', Rule::in(Branch::STATUSES)],
        ]);

        $branch->update($data);

        return response()->json(['data' => $branch]);
    }

    // DELETE /api/admin/branches/{branch}
    public function destroy(Branch $branch)
    {
        DB::transaction(function () use ($branch) {
            // Cascade manual (no-FK): lepaskan lokasi dari cabang agar tidak yatim.
            Location::where('branch_id', $branch->id)->update(['branch_id' => null]);
            $branch->delete();
        });

        return response()->json(['message' => 'Branch deleted']);
    }
}
