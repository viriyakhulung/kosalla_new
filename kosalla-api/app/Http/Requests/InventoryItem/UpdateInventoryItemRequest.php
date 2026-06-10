<?php

namespace App\Http\Requests\InventoryItem;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryItemRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'master_product_id' => ['sometimes','integer','exists:master_products,id'],
            'is_active' => ['nullable','boolean'],
        ];
    }
}
