<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContractRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'organization_id' => ['sometimes', 'exists:organizations,id'],
            'contract_number' => ['sometimes', 'string', 'max:120'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:active,expired,terminated'],
            'reminder_days_before_end' => ['sometimes', 'integer', 'min:0', 'max:3650'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
