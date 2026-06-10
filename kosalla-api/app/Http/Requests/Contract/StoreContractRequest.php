<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'organization_id' => ['required', 'exists:organizations,id'],
            'contract_number' => ['required', 'string', 'max:120'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:active,expired,terminated'],
            'reminder_days_before_end' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
