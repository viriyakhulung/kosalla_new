<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->hasRole('super-admin'); }

    public function rules(): array
    {
        $orgId = $this->route('organization')->id;

        return [
            'name' => ['sometimes','string','max:200'],
            'slug' => ['sometimes','string','max:200', Rule::unique('organizations','slug')->ignore($orgId)],
            'contact_email' => ['nullable','email','max:200'],
            'phone' => ['nullable','string','max:50'],
            'address' => ['nullable','string'],
            'is_active' => ['sometimes','boolean'],
        ];
    }
}
