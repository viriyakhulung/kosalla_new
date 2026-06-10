<?php

namespace App\Http\Requests\InventoryItem;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryItemRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'master_product_id' => ['required', 'integer', 'exists:master_products,id'],
            'is_active' => ['nullable','boolean'],
        ];
    }
}
