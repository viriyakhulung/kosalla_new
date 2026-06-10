<?php

namespace App\Http\Requests\AdminUser;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],

            // ✅ Password policy: min 8, wajib upper+lower, angka, simbol
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],

            'organization_id' => ['required', 'integer', 'exists:organizations,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'master_role_id' => ['required', 'integer', 'exists:master_roles,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'Password wajib diisi.',
        ];
    }
}
