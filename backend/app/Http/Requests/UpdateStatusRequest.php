<?php

namespace App\Http\Requests;

use App\Models\DocumentRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStatusRequest extends FormRequest
{
    use SanitizesInput;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->stripTagsFrom(['remarks', 'or_number']);
    }

    public function rules(): array
    {
        return [
            'status'      => ['required', Rule::in(DocumentRequest::STATUSES)],
            'remarks'     => [$this->status === 'rejected' ? 'required' : 'nullable', 'string', 'max:1000'],
            'pickup_date' => [$this->status === 'ready_for_pickup' ? 'required' : 'nullable', 'date', 'after_or_equal:today'],
            'is_paid'     => ['nullable', 'boolean'],
            'or_number'   => ['nullable', 'string', 'max:40'],
        ];
    }

    public function messages(): array
    {
        return [
            'remarks.required'     => 'Please give a reason for rejecting this request.',
            'pickup_date.required' => 'Please set a pickup date.',
        ];
    }
}
