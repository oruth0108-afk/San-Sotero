<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRequestRequest;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Resident-facing request endpoints. Every query is scoped to the signed-in resident. */
class RequestController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['status' => ['nullable', Rule::in(DocumentRequest::STATUSES)]]);

        $query = $request->user()->requests()->with('documentType:id,name')->latest('id')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('q'), function ($q) use ($request) {
                $s = '%' . addcslashes($request->q, '%_\\') . '%';
                $q->where(fn ($w) => $w->where('reference_no', 'like', $s)
                    ->orWhereHas('documentType', fn ($t) => $t->where('name', 'like', $s)));
            });

        return $query->paginate(min((int) $request->input('per_page', 10), 50));
    }

    public function summary(Request $request)
    {
        $counts = $request->user()->requests()->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'by_status' => collect(DocumentRequest::STATUSES)->mapWithKeys(fn ($s) => [$s => (int) ($counts[$s] ?? 0)]),
            'total'     => (int) $counts->sum(),
        ]);
    }

    public function show(DocumentRequest $documentRequest)
    {
        Gate::authorize('view', $documentRequest);

        // Staff names are deliberately not exposed to residents.
        $documentRequest->load(['documentType', 'attachments', 'histories']);
        $documentRequest->histories->each->makeHidden('changed_by');

        return response()->json(['data' => $documentRequest->makeHidden(['reviewed_by', 'approved_by', 'released_by'])]);
    }

    public function store(StoreRequestRequest $request)
    {
        $user = $request->user();

        if ($user->account_status !== 'verified') {
            return response()->json(['message' => 'Your account must be verified by barangay staff before you can submit a request.'], 403);
        }

        $data = $request->validated();
        $type = DocumentType::findOrFail($data['document_type_id']);

        $docRequest = DB::transaction(function () use ($request, $user, $type, $data) {
            $r = DocumentRequest::create([
                'user_id'          => $user->id,
                'document_type_id' => $type->id,
                'purpose'          => $data['purpose'],
                'purpose_details'  => $data['purpose_details'] ?? null,
                'status'           => 'pending',
                'fee_amount'       => $type->fee,
            ]);
            $r->update(['reference_no' => sprintf('SS-%s-%06d', now()->format('Y'), $r->id)]);

            foreach ($type->required_attachments ?? [] as $i => $label) {
                $file = $request->file("attachments.$i");
                $r->attachments()->create([
                    'label'         => $label,
                    'original_name' => mb_substr(basename($file->getClientOriginalName()), 0, 200),
                    'path'          => $file->store("requests/{$r->id}", 'local'),
                    'mime'          => $file->getMimeType(),
                    'size'          => $file->getSize(),
                ]);
            }

            $r->histories()->create(['to_status' => 'pending', 'remarks' => 'Request submitted.', 'changed_by' => $user->id]);
            return $r;
        });

        ActivityLogger::log('request_submitted', "Submitted {$type->name} ({$docRequest->reference_no})", $docRequest);
        Notifier::toUser($user, 'Request received', "We received your request for {$type->name}. Your reference number is {$docRequest->reference_no}.", $docRequest);
        Notifier::toStaff('New document request', "{$user->name} requested {$type->name} ({$docRequest->reference_no}).", $docRequest);

        return response()->json(['data' => $docRequest->load('documentType')], 201);
    }
}
