<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentRequest extends Model
{
    public const STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'ready_for_pickup', 'released'];

    // Allowed workflow moves. 'rejected' and 'released' are final.
    public const TRANSITIONS = [
        'pending'          => ['under_review', 'rejected'],
        'under_review'     => ['approved', 'rejected'],
        'approved'         => ['ready_for_pickup'],
        'ready_for_pickup' => ['released'],
    ];

    public const PRINTABLE = ['approved', 'ready_for_pickup', 'released'];

    // Never mass-assigned from user input; controllers set fields explicitly.
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'pickup_date' => 'date:Y-m-d',
            'fee_amount'  => 'decimal:2',
            'is_paid'     => 'boolean',
            'approved_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function canMoveTo(string $status): bool
    {
        return in_array($status, self::TRANSITIONS[$this->status] ?? [], true);
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function documentType(): BelongsTo { return $this->belongsTo(DocumentType::class); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function releaser(): BelongsTo { return $this->belongsTo(User::class, 'released_by'); }
    public function attachments(): HasMany { return $this->hasMany(RequestAttachment::class); }
    public function histories(): HasMany { return $this->hasMany(RequestStatusHistory::class)->orderBy('id'); }
}
