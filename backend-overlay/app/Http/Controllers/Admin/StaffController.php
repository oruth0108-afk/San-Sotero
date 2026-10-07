<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StaffRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function index()
    {
        return response()->json(['data' => User::staffMembers()->orderBy('name')->get()]);
    }

    public function store(StaffRequest $request)
    {
        $data = $request->validated();
        $user = new User($data);
        $user->role = $data['role'];
        $user->account_status = 'verified';
        $user->verified_at = now();
        $user->save();

        ActivityLogger::log('staff_created', "Created {$user->role} account for {$user->name}", $user);
        return response()->json(['data' => $user], 201);
    }

    public function updateStatus(Request $request, User $user)
    {
        abort_unless($user->isStaffMember(), 404);
        $data = $request->validate(['status' => ['required', Rule::in(['verified', 'deactivated'])]]);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->update(['account_status' => $data['status']]);
        if ($data['status'] === 'deactivated') {
            $user->tokens()->delete();
        }

        ActivityLogger::log('staff_' . $data['status'], "Set {$user->name}'s account to {$data['status']}", $user);
        return response()->json(['data' => $user]);
    }
}
