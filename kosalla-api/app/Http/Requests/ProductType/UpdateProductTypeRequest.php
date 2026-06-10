<?php

namespace App\Http\Requests\ProductType;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
   public function rules(): array
{
    return [
        'organization_id' => ['sometimes','exists:organizations,id'],
        'name' => ['sometimes','string','max:120'],
        'code' => ['sometimes','string','max:50'],
        'description' => ['nullable','string'],
        'is_active' => ['nullable','boolean'],
    ];
}

}
