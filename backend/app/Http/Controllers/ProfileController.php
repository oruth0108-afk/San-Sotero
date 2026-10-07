<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->safe()->except('valid_id');
        $user->fill($data);
        $message = 'Profile updated.';

        if ($request->hasFile('valid_id')) {
            if ($user->valid_id_path) {
                Storage::disk('local')->delete($user->valid_id_path);
            }
            $user->valid_id_path = $request->file('valid_id')->store('valid-ids', 'local');

            // A replaced ID must be checked again by barangay staff.
            if ($user->isResident() && $user->account_status === 'verified') {
                $user->account_status = 'pending';
                $user->verified_at = null;
                $message = 'Profile updated. Your new ID will be checked by barangay staff before you can submit new requests.';
            }
        }

        $user->save();
        ActivityLogger::log('profile_update', "{$user->name} updated their profile", $user);

        return response()->json(['message' => $message, 'user' => $user->fresh()]);
    }

    public function password(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'confirmed', Password::min(8)->letters()->numbers(), 'different:current_password'],
        ]);

        $user = $request->user();
        $user->update(['password' => $data['password']]);
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete(); // sign out other devices
        ActivityLogger::log('password_change', "{$user->name} changed their password", $user);

        return response()->json(['message' => 'Password changed.']);
    }
}
