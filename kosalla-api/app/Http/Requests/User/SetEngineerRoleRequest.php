<?php 

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class SetEngineerRoleRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->hasRole('super-admin'); }

    public function rules(): array
    {
        return [
            'role' => ['required','in:engineer-manager,engineer-staff'],
        ];
    }
}
