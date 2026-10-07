<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StaffRequest extends FormRequest
{
    use SanitizesInput;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->stripTagsFrom(['name']);
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email:rfc', 'max:150', 'unique:users,email'],
            'role'     => ['required', Rule::in(['admin', 'staff', 'captain'])],
            'password' => ['required', Password::min(8)->letters()->numbers()],
        ];
    }
}
