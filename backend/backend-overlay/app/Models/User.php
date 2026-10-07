<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const STAFF_ROLES = ['admin', 'staff', 'captain'];

    // role / account_status are intentionally NOT fillable (prevents privilege escalation).
    protected $fillable = ['name', 'email', 'password', 'purok', 'address', 'birthdate',
        'civil_status', 'contact_number', 'valid_id_type'];

    protected $hidden = ['password', 'remember_token', 'valid_id_path'];
    protected $appends = ['has_valid_id'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'birthdate'         => 'date:Y-m-d',
            'verified_at'       => 'datetime',
            'last_login_at'     => 'datetime',
        ];
    }

    public function getHasValidIdAttribute(): bool
    {
        return !empty($this->valid_id_path);
    }

    public function isResident(): bool { return $this->role === 'resident'; }
    public function isStaffMember(): bool { return in_array($this->role, self::STAFF_ROLES, true); }
    public function canApprove(): bool { return in_array($this->role, ['admin', 'captain'], true); }

    public function requests(): HasMany { return $this->hasMany(DocumentRequest::class); }
    public function userNotifications(): HasMany { return $this->hasMany(UserNotification::class); }

    public function scopeStaffMembers($q) { return $q->whereIn('role', self::STAFF_ROLES); }
}
