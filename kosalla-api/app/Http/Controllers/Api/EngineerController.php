<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Engineer;
use App\Models\User;
use Illuminate\Http\Request;

class EngineerController extends Controller
{
    public function index()
    {
        return Engineer::with('user:id,name,email,master_role_id,organization_id,location_id')
            ->latest()
            ->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required','integer','exists:users,id','unique:engineers,user_id'],
            'title' => ['nullable','string','max:100'],
            'level' => ['required','string','max:30'],
            'phone' => ['nullable','string','max:50'],
            'is_active' => ['boolean'],
        ]);

        $engineer = Engineer::create($data);
        return response()->json($engineer->load('user:id,name,email'), 201);
    }

    public function show(Engineer $engineer)
    {
        return $engineer->load('user:id,name,email');
    }

    public function update(Request $request, Engineer $engineer)
    {
        $data = $request->validate([
            'title' => ['nullable','string','max:100'],
            'level' => ['sometimes','string','max:30'],
            'phone' => ['nullable','string','max:50'],
            'is_active' => ['boolean'],
        ]);

        $engineer->update($data);
        return $engineer->load('user:id,name,email');
    }

    public function destroy(Engineer $engineer)
    {
        $engineer->delete();
        return response()->json(['message' => 'Engineer deleted']);
    }

    // optional: list user internal kandidat (belum punya engineer profile)
    public function candidates()
    {
        // minimal: semua user yg master role nya internal (sesuaikan kalau kamu punya definisi)
        // kalau belum ada filter role, ambil semua user yg belum ada engineer
        return User::query()
            ->whereDoesntHave('engineer')
            ->select('id','name','email')
            ->orderBy('name')
            ->get();
    }
}
