<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth dicek via middleware
    }

    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:200'],

            // ✅ mindmap: description-only (WYSIWYG)
            'description_html' => ['required', 'string'],

            // ✅ sesuai migration alter
            'inventory_item_id' => ['nullable', 'integer', 'exists:inventory_items,id'],
            'category' => ['nullable', 'string', 'max:200'],
            'tagging_word' => ['nullable', 'string', 'max:100'],

            'priority' => ['nullable', 'in:low,normal,high'],

            // Handler (Team Lead) — reuse kolom tickets.assigned_to.
            // Sengaja TANPA rule `exists:` (no FK / no query-validate); integritas
            // dijaga di application layer pada PortalTicketController::store.
            'assigned_to' => ['nullable', 'integer'],

            // optional
            'action_number' => ['nullable', 'string', 'max:80'],
            'requested_resolution_date' => ['nullable', 'date'],
            'expected_date' => ['nullable', 'date'],

            'version' => ['nullable', 'string', 'max:100'],
            'build_no' => ['nullable', 'string', 'max:100'],
            'patch_no' => ['nullable', 'string', 'max:100'],
            'module' => ['nullable', 'string', 'max:150'],
            'error_code' => ['nullable', 'string', 'max:100'],

            'severity' => ['nullable', 'string', 'max:50'],
            'project' => ['nullable', 'string', 'max:150'],
            'customer' => ['nullable', 'string', 'max:150'],

            'complete_ps' => ['nullable', 'boolean'],
            'schedule_comment' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'inventory_item_id.exists' => 'Inventory item tidak ditemukan.',
        ];
    }
}
