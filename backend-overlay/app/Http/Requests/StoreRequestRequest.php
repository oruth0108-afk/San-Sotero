<?php

namespace App\Http\Requests;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequestRequest extends FormRequest
{
    use SanitizesInput;

    private ?DocumentType $type = null;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->stripTagsFrom(['purpose', 'purpose_details']);
    }

    private function type(): ?DocumentType
    {
        return $this->type ??= DocumentType::find($this->input('document_type_id'));
    }

    public function rules(): array
    {
        $needsDetails = $this->input('purpose') === 'Others' || $this->type()?->template === 'business';

        $rules = [
            'document_type_id' => ['required', Rule::exists('document_types', 'id')->where('is_active', true)],
            'purpose'          => ['required', Rule::in(config('barangay.purposes'))],
            'purpose_details'  => [$needsDetails ? 'required' : 'nullable', 'string', 'max:500'],
        ];

        // One upload per required attachment, keyed by its position: attachments[0], attachments[1], ...
        foreach ($this->type()?->required_attachments ?? [] as $i => $label) {
            $rules["attachments.$i"] = ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'];
        }

        return $rules;
    }

    public function attributes(): array
    {
        $attrs = ['purpose_details' => 'details'];
        foreach ($this->type()?->required_attachments ?? [] as $i => $label) {
            $attrs["attachments.$i"] = strtolower($label);
        }
        return $attrs;
    }
}
