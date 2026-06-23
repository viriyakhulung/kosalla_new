<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TransferTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth & otorisasi transfer dicek di controller (application layer)
    }

    public function rules(): array
    {
        // Sengaja TANPA rule `exists:` — integritas team tujuan diverifikasi
        // di application layer (TicketTransferService::resolveValidTarget).
        return [
            'to_team_group_id' => ['required', 'integer'],
            'note'             => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'to_team_group_id.required' => 'Team tujuan wajib dipilih.',
            'note.required'             => 'Catatan/alasan transfer wajib diisi.',
        ];
    }
}
