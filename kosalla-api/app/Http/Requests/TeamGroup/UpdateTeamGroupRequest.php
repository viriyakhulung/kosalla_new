<?php

namespace App\Http\Requests\TeamGroup;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeamGroupRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('team_group')?->id;

        return [
            'name'              => ['sometimes', 'string', 'max:120'],
            'code'              => ['sometimes', 'string', 'max:50', 'alpha_dash', "unique:team_groups,code,{$id}"],
            'is_active'         => ['nullable', 'boolean'],
            'organization_id'   => ['nullable', 'integer', 'exists:organizations,id'],
            'handles_category'  => ['nullable', 'string', 'max:100'],
        ];
    }
}
