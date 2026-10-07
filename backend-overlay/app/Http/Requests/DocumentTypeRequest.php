<?php

namespace App\Http\Requests;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DocumentTypeRequest extends FormRequest
{
    use SanitizesInput;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->stripTagsFrom(['name', 'description']);
        if (is_array($this->input('required_attachments'))) {
            $this->merge(['required_attachments' => array_values(array_filter(
                array_map(fn ($v) => trim(strip_tags((string) $v)), $this->input('required_attachments'))
            ))]);
        }
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:120', Rule::unique('document_types', 'name')->ignore($this->route('documentType'))],
            'description'            => ['nullable', 'string', 'max:500'],
            'fee'                    => ['required', 'numeric', 'min:0', 'max:100000'],
            'processing_days'        => ['required', 'integer', 'min:1', 'max:60'],
            'required_attachments'   => ['nullable', 'array', 'max:8'],
            'required_attachments.*' => ['string', 'max:100'],
            'template'               => ['required', Rule::in(DocumentType::TEMPLATES)],
            'is_active'              => ['required', 'boolean'],
        ];
    }
}
