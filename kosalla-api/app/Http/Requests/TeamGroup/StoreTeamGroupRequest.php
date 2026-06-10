<?php

namespace App\Http\Requests\TeamGroup;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeamGroupRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'              => ['required', 'string', 'max:120'],
            'code'              => ['required', 'string', 'max:50', 'alpha_dash', 'unique:team_groups,code'],
            'is_active'         => ['nullable', 'boolean'],
            'organization_id'   => ['nullable', 'integer', 'exists:organizations,id'],
            'handles_category'  => ['nullable', 'string', 'max:100'],
        ];
    }
}
