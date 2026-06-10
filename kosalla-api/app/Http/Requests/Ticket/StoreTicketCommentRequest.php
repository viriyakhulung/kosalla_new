<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->masterRole?->name;

        return in_array($role, [
            'custstaff',
            'viriyastaff',
            'superadmin',
        ], true);
    }

    public function rules(): array
{
    return [
        'body' => ['required', 'string'],
        'is_internal' => ['nullable', 'boolean'],

        // attachments per bubble chat
        'files' => ['nullable', 'array', 'max:5'],
        'files.*' => [
            'file',
            'max:10240', // 10MB per file (KB)
            'mimes:pdf,png,jpg,jpeg,doc,docx,xls,xlsx,txt,zip',
        ],
    ];
}

}
