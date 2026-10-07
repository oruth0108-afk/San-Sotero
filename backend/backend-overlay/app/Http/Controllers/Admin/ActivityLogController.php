<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['from' => ['nullable', 'date'], 'to' => ['nullable', 'date']]);

        return ActivityLog::with('user')
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->action))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->when($request->filled('q'), function ($q) use ($request) {
                $s = '%' . addcslashes($request->q, '%_\\') . '%';
                $q->where(fn ($w) => $w->where('description', 'like', $s)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $s)));
            })
            ->latest('id')->paginate(min((int) $request->input('per_page', 25), 100));
    }

    public function actions()
    {
        return response()->json(['data' => ActivityLog::select('action')->distinct()->orderBy('action')->pluck('action')]);
    }
}
