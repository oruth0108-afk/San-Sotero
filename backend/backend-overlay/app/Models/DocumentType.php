<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentType extends Model
{
    public const TEMPLATES = ['clearance', 'residency', 'indigency', 'good_moral', 'business', 'barangay_id', 'generic'];

    protected $fillable = ['name', 'slug', 'description', 'fee', 'processing_days',
        'required_attachments', 'template', 'is_active'];

    protected function casts(): array
    {
        return [
            'required_attachments' => 'array',
            'fee'                  => 'decimal:2',
            'is_active'            => 'boolean',
        ];
    }

    public function requests(): HasMany { return $this->hasMany(DocumentRequest::class); }
    public function scopeActive($q) { return $q->where('is_active', true); }
}
