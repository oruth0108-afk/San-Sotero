<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityLogger
{
    public static function log(string $action, string $description, ?Model $subject = null, ?User $actor = null): void
    {
        $actor ??= auth()->user();
        ActivityLog::create([
            'user_id'      => $actor?->id,
            'action'       => $action,
            'description'  => $description,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id'   => $subject?->getKey(),
            'ip_address'   => request()->ip(),
            'user_agent'   => mb_substr((string) request()->userAgent(), 0, 255),
        ]);
    }
}
