<?php

namespace App\Http\Requests\Location;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $u = $this->user();
        if (!$u) return false;

        $roleId = (int) (
            $u->master_role_id ??
            $u->user?->master_role_id ??
            0
        );

        $masterRole = strtolower((string) (
            $u->master_role ??
            $u->user?->master_role ??
            $u->role ??
            $u->user?->role ??
            ''
        ));

        // ? superadmin only (sesuai middleware master_role:superadmin)
        return $roleId === 1 || in_array($masterRole, ['superadmin', 'super_admin'], true);
    }

    public function rules(): array
    {
        $org = $this->route('organization');

        return [
            'name' => ['required', 'string', 'max:200'],

            // ? nullable biar bisa auto-generate di controller kalau FE tidak kirim
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('locations', 'code')->where('organization_id', $org->id),
            ],

            'address' => ['nullable', 'string'],
            'timezone' => ['nullable', 'string', 'max:64'],

            // branch_id opsional; harus cabang milik organisasi yang sama (same-org).
            'branch_id' => [
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where('organization_id', $org->id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.exists' => 'Cabang tidak ditemukan atau bukan milik organisasi ini.',
        ];
    }
}