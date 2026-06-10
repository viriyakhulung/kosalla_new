<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;

class AssignUserToTeamRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->hasRole('super-admin'); }

    public function rules(): array
    {
        return [
            'user_id' => ['required','integer','exists:users,id'],
            'team_group_id' => ['required','integer','exists:team_groups,id'],
            'is_lead' => ['nullable','boolean'],
        ];
    }
}
