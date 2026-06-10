<?php 

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Location\StoreLocationRequest;
use App\Http\Requests\Location\UpdateLocationRequest;
use App\Models\Organization;
use App\Models\Location;
use Illuminate\Support\Str;

class LocationController extends Controller
{
    public function index(Organization $organization)
    {
        return $organization->locations()->latest()->paginate(50);
    }

    public function store(StoreLocationRequest $request, Organization $organization)
    {
      $data = $request->validated();

    // kalau FE belum kirim code, kita buat dari name
    $data['code'] = $data['code'] ?? Str::slug($data['name'], '-');

    $loc = $organization->locations()->create($data);

    return response()->json($loc, 201);
    }

    public function show(Location $location)
    {
        return $location->load('organization');
    }

    public function update(UpdateLocationRequest $request, Location $location)
    {
        $location->update($request->validated());
        return $location;
    }

    public function destroy(Location $location)
    {
        $location->delete();
        return response()->json(['message' => 'Location deleted']);
    }
}
