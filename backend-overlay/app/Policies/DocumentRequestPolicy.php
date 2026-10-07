<?php

namespace App\Policies;

use App\Models\DocumentRequest;
use App\Models\User;

class DocumentRequestPolicy
{
    public function view(User $user, DocumentRequest $request): bool
    {
        return $user->isStaffMember() || $request->user_id === $user->id;
    }

    public function process(User $user, DocumentRequest $request): bool
    {
        return $user->isStaffMember();
    }

    /** Only the Barangay Captain (or Admin/Secretary) may approve. */
    public function approve(User $user, DocumentRequest $request): bool
    {
        return $user->canApprove();
    }
}
