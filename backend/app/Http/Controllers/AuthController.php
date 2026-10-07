<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        $user = new User(collect($data)->except('valid_id')->all());
        $user->role = 'resident';
        $user->account_status = 'pending';
        $user->valid_id_path = $request->file('valid_id')->store('valid-ids', 'local'); // private disk
        $user->save();

        ActivityLogger::log('register', "New resident registered: {$user->name}", $user, $user);
        Notifier::toStaff('New resident registration', "{$user->name} registered and is waiting for verification.");

        return response()->json(['user' => $user, 'token' => $this->token($user)], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            ActivityLogger::log('login_failed', "Failed login attempt for {$credentials['email']}", null, $user);
            throw ValidationException::withMessages(['email' => ['Incorrect email or password.']]);
        }

        if ($user->account_status === 'deactivated') {
            return response()->json(['message' => 'Your account has been deactivated. Please contact the barangay office.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        ActivityLogger::log('login', "{$user->name} signed in", $user, $user);

        return response()->json(['user' => $user, 'token' => $this->token($user)]);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request)
    {
        ActivityLogger::log('logout', "{$request->user()->name} signed out", $request->user());
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Signed out.']);
    }

    private function token(User $user): string
    {
        return $user->createToken('spa', ['*'], now()->addHours(12))->plainTextToken;
    }
}
