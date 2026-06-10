<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeamGroup\StoreTeamGroupRequest;
use App\Http\Requests\TeamGroup\UpdateTeamGroupRequest;
use App\Models\TeamGroup;

class TeamGroupController extends Controller
{
    public function index()
    {
        return TeamGroup::with('organization:id,name')->latest()->paginate(50);
    }

    public function store(StoreTeamGroupRequest $request)
    {
        $tg = TeamGroup::create([
            'name'             => $request->name,
            'code'             => $request->code,
            'is_active'        => $request->boolean('is_active', true),
            'organization_id'  => $request->organization_id ?? null,
            'handles_category' => $request->handles_category ?? null,
        ]);

        return response()->json($tg->load('organization:id,name'), 201);
    }

    public function show(TeamGroup $teamGroup)
    {
        return $teamGroup->load('organization:id,name');
    }

    public function update(UpdateTeamGroupRequest $request, TeamGroup $teamGroup)
    {
        $teamGroup->update($request->validated());
        return $teamGroup->fresh()->load('organization:id,name');
    }

    public function destroy(TeamGroup $teamGroup)
    {
        $teamGroup->delete();
        return response()->json(['message' => 'Team group deleted']);
    }
}
