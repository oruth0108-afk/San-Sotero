<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAccountActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && $user->account_status === 'deactivated') {
            $user->tokens()->delete();
            abort(403, 'Your account has been deactivated. Please contact the barangay office.');
        }
        return $next($request);
    }
}
