<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $counts = DocumentRequest::select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status');

        $byType = DocumentType::withCount('requests')->orderByDesc('requests_count')->get(['id', 'name'])
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'total' => $t->requests_count]);

        $start = now()->startOfMonth()->subMonths(5);
        $perMonth = DocumentRequest::where('created_at', '>=', $start)->pluck('created_at')
            ->groupBy(fn ($d) => $d->format('Y-m'))->map->count();
        $monthly = collect(range(0, 5))->map(function ($i) use ($start, $perMonth) {
            $m = $start->copy()->addMonths($i);
            return ['month' => $m->format('Y-m'), 'label' => $m->format('M'), 'total' => (int) ($perMonth[$m->format('Y-m')] ?? 0)];
        });

        return response()->json([
            'totals' => [
                'all'               => (int) $counts->sum(),
                'today'             => DocumentRequest::whereDate('created_at', today())->count(),
                'this_month'        => DocumentRequest::where('created_at', '>=', now()->startOfMonth())->count(),
                'pending_residents' => User::where('role', 'resident')->where('account_status', 'pending')->count(),
            ],
            'by_status' => collect(DocumentRequest::STATUSES)->mapWithKeys(fn ($s) => [$s => (int) ($counts[$s] ?? 0)]),
            'by_type'   => $byType,
            'monthly'   => $monthly,
            'recent'    => DocumentRequest::with(['user:id,name', 'documentType:id,name'])->latest('id')->limit(8)->get(),
        ]);
    }
}
