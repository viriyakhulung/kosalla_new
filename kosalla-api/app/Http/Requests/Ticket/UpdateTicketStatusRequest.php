<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['engineer-manager','engineer-staff','super-admin']);
    }

    public function rules(): array
    {
        return [
            'status' => ['required','in:open,in_progress,resolved,closed'],
            'assigned_team_group_id' => ['nullable','integer','exists:team_groups,id'],
            'assigned_to' => ['nullable','integer','exists:users,id'],
        ];
    }
}
