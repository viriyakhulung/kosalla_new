<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Cukup terautentikasi — user mengedit dirinya sendiri.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        // SENGAJA hanya 4 kolom kontak. Field lain (name/email/role/org)
        // otomatis ter-strip karena controller memakai $request->validated().
        return [
            // Hanya angka + karakter telepon umum (+, -, spasi, kurung). Huruf ditolak.
            'phone'        => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]+$/'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city'         => ['nullable', 'string', 'max:100'],
            // Kode pos hanya digit.
            'postal_code'  => ['nullable', 'string', 'max:10', 'regex:/^[0-9]+$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.max'         => 'Nomor telepon maksimal 30 karakter.',
            'phone.regex'       => 'Nomor telepon hanya boleh berisi angka.',
            'address_line.max'  => 'Alamat maksimal 255 karakter.',
            'city.max'          => 'Kota maksimal 100 karakter.',
            'postal_code.max'   => 'Kode pos maksimal 10 karakter.',
            'postal_code.regex' => 'Kode pos hanya boleh berisi angka.',
        ];
    }
}
