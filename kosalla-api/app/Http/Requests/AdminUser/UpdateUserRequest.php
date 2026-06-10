<?php

namespace App\Http\Requests\AdminUser;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],

            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],

            // ✅ kalau admin isi password saat update => wajib policy baru
            'password' => [
                'nullable',
                'string',
                Password::min(8)
                    ->mixedCase() // huruf besar + kecil
                    ->numbers()   // angka
                    ->symbols(),  // simbol
            ],

            'organization_id' => ['sometimes', 'integer', 'exists:organizations,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'master_role_id' => ['sometimes', 'integer', 'exists:master_roles,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.min' => 'Password minimal 8 karakter.',
        ];
    }
}
