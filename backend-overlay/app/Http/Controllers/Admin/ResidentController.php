<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['status' => ['nullable', Rule::in(['pending', 'verified', 'deactivated'])]]);

        return User::where('role', 'resident')->withCount('requests')
            ->when($request->filled('status'), fn ($q) => $q->where('account_status', $request->status))
            ->when($request->filled('q'), function ($q) use ($request) {
                $s = '%' . addcslashes($request->q, '%_\\') . '%';
                $q->where(fn ($w) => $w->where('name', 'like', $s)->orWhere('email', 'like', $s)->orWhere('purok', 'like', $s));
            })
            ->latest('id')->paginate(min((int) $request->input('per_page', 15), 100));
    }

    public function updateStatus(Request $request, User $user)
    {
        abort_unless($user->isResident(), 404);
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'verified', 'deactivated'])]]);

        $user->account_status = $data['status'];
        $user->verified_at = $data['status'] === 'verified' ? now() : null;
        $user->save();

        if ($data['status'] === 'deactivated') {
            $user->tokens()->delete();
        }
        if ($data['status'] === 'verified') {
            Notifier::toUser($user, 'Account verified', 'Your account has been verified. You can now submit document requests.');
        }

        ActivityLogger::log('resident_' . $data['status'], "Set {$user->name}'s account to {$data['status']}", $user);
        return response()->json(['data' => $user->loadCount('requests')]);
    }

    /** Streams a resident's ID. Every view is written to the audit trail. */
    public function validId(User $user)
    {
        abort_unless($user->isResident() && $user->valid_id_path && Storage::disk('local')->exists($user->valid_id_path), 404, 'No ID on file.');

        ActivityLogger::log('view_valid_id', "Viewed the valid ID of {$user->name}", $user);
        return Storage::disk('local')->response($user->valid_id_path, null, ['X-Content-Type-Options' => 'nosniff']);
    }
}
