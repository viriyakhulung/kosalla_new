<?php 

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrganizationRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->hasRole('super-admin'); }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:200'],
            'slug' => ['required','string','max:200', Rule::unique('organizations','slug')],
            'contact_email' => ['nullable','email','max:200'],
            'phone' => ['nullable','string','max:50'],
            'address' => ['nullable','string'],
            'is_active' => ['sometimes','boolean'],
        ];
    }
}
