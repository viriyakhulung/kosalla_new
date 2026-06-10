<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Contract::with('organization')
                ->latest()
                ->paginate(50),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'organization_id' => ['required', 'exists:organizations,id'],
            'contract_number' => ['required', 'string', 'max:120'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:active,expired,terminated'],
            'reminder_days_before_end' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'notes' => ['nullable', 'string'],
        ]);

        // default
        $data['status'] = $data['status'] ?? 'active';
        $data['reminder_days_before_end'] = $data['reminder_days_before_end'] ?? 90;

        $contract = Contract::create($data);

        return response()->json([
            'data' => $contract->load('organization'),
        ], 201);
    }

    public function show(Contract $contract)
    {
        return response()->json([
            'data' => $contract->load('organization'),
        ]);
    }

    public function update(Request $request, Contract $contract)
    {
        $data = $request->validate([
            'organization_id' => ['sometimes', 'exists:organizations,id'],
            'contract_number' => ['sometimes', 'string', 'max:120'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:active,expired,terminated'],
            'reminder_days_before_end' => ['sometimes', 'integer', 'min:0', 'max:3650'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $contract->update($data);

        return response()->json([
            'data' => $contract->load('organization'),
        ]);
    }

    public function destroy(Contract $contract)
    {
        $contract->delete();

        return response()->json([
            'message' => 'Contract deleted',
        ]);
    }

    public function expiringSoon(Request $request)
    {
        $days = (int)($request->query('days', 90));

        $list = Contract::with('organization')
            ->where('status', 'active')
            ->whereDate('end_date', '<=', now()->addDays($days))
            ->orderBy('end_date')
            ->get();

        return response()->json([
            'data' => $list,
        ]);
    }
}
