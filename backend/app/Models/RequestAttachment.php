<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestAttachment extends Model
{
    protected $guarded = [];
    protected $hidden = ['path'];

    public function request(): BelongsTo { return $this->belongsTo(DocumentRequest::class, 'document_request_id'); }
}
