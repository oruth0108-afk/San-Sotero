<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    use SanitizesInput;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->stripTagsFrom(['name', 'purok', 'address', 'valid_id_type']);
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:120'],
            'purok'          => ['required', 'string', 'max:100'],
            'address'        => ['required', 'string', 'max:255'],
            'birthdate'      => ['required', 'date', 'before:today', 'after:1900-01-01'],
            'civil_status'   => ['required', Rule::in(config('barangay.civil_statuses'))],
            'contact_number' => ['required', 'regex:/^(09|\+639)\d{9}$/'],
            'valid_id_type'  => ['nullable', 'string', 'max:60'],
            'valid_id'       => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
        ];
    }

    public function messages(): array
    {
        return ['contact_number.regex' => 'Enter a valid mobile number, e.g. 09171234567.'];
    }
}
