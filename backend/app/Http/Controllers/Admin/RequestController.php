<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStatusRequest;
use App\Models\DocumentRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RequestController extends Controller
{
    public function index(Request $request)
    {
        return $this->filtered($request)->paginate(min((int) $request->input('per_page', 15), 100));
    }

    public function show(DocumentRequest $documentRequest)
    {
        Gate::authorize('process', $documentRequest);

        $documentRequest->load([
            'user', 'documentType', 'attachments', 'histories.changer',
            'reviewer:id,name', 'approver:id,name', 'releaser:id,name',
        ]);

        return response()->json(['data' => $documentRequest]);
    }

    public function updateStatus(UpdateStatusRequest $request, DocumentRequest $documentRequest)
    {
        Gate::authorize('process', $documentRequest);
        $data = $request->validated();
        $to = $data['status'];
        $actor = $request->user();

        if ($to === 'approved') {
            Gate::authorize('approve', $documentRequest);
        }

        DB::transaction(function () use (&$documentRequest, $data, $to, $actor) {
            // Lock the row so two officials cannot move the same request at once.
            $r = DocumentRequest::whereKey($documentRequest->id)->lockForUpdate()->firstOrFail();

            if (!$r->canMoveTo($to)) {
                throw ValidationException::withMessages([
                    'status' => ["This request is already \"{$r->status}\" and cannot be changed to \"{$to}\"."],
                ]);
            }

            if ($to === 'released' && $r->fee_amount > 0 && empty($data['is_paid']) && !$r->is_paid) {
                throw ValidationException::withMessages(['is_paid' => ['Please confirm that the fee has been paid before releasing.']]);
            }

            $from = $r->status;
            $r->status = $to;
            if (!empty($data['remarks'])) {
                $r->remarks = $data['remarks'];
            }

            match ($to) {
                'under_review'     => $r->reviewed_by = $actor->id,
                'approved'         => [$r->approved_by, $r->approved_at] = [$actor->id, now()],
                'rejected'         => $r->rejection_reason = $data['remarks'],
                'ready_for_pickup' => $r->pickup_date = $data['pickup_date'],
                'released'         => [$r->released_by, $r->released_at] = [$actor->id, now()],
            };

            if ($to === 'released') {
                $r->is_paid = $r->is_paid || !empty($data['is_paid']);
                $r->or_number = $data['or_number'] ?? $r->or_number;
            }

            $r->save();
            $r->histories()->create([
                'from_status' => $from, 'to_status' => $to,
                'remarks' => $data['remarks'] ?? null, 'changed_by' => $actor->id,
            ]);

            $documentRequest = $r;
        });

        $documentRequest->load(['user', 'documentType']);
        ActivityLogger::log('request_' . $to, "Set {$documentRequest->reference_no} to {$to}", $documentRequest);
        $this->notifyResident($documentRequest, $data);

        return response()->json(['data' => $documentRequest->fresh(['user', 'documentType', 'attachments', 'histories.changer', 'reviewer:id,name', 'approver:id,name', 'releaser:id,name'])]);
    }

    public function pdf(DocumentRequest $documentRequest)
    {
        Gate::authorize('process', $documentRequest);

        if (!in_array($documentRequest->status, DocumentRequest::PRINTABLE, true)) {
            return response()->json(['message' => 'A document can only be generated after the request is approved.'], 422);
        }

        $r = $documentRequest->load(['user', 'documentType', 'reviewer', 'approver']);
        $captain = User::where('role', 'captain')->where('account_status', 'verified')->value('name') ?? config('barangay.captain_name');

        ActivityLogger::log('pdf_generated', "Generated PDF for {$r->reference_no}", $r);

        return Pdf::loadView('pdf.certificate', compact('r', 'captain'))
            ->setPaper('a4')->download("{$r->reference_no}.pdf");
    }

    public function export(Request $request, string $format)
    {
        $rows = $this->filtered($request)->limit(2000)->get();
        ActivityLogger::log('export', 'Exported ' . $rows->count() . ' request(s) as ' . strtoupper($format));
        $stamp = now()->format('Ymd-His');

        if ($format === 'pdf') {
            return Pdf::loadView('pdf.requests', ['rows' => $rows, 'generatedBy' => $request->user()->name])
                ->setPaper('a4', 'landscape')->download("requests-{$stamp}.pdf");
        }

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Reference No', 'Resident', 'Purok', 'Document', 'Purpose', 'Status', 'Fee', 'Paid', 'Pickup Date', 'Submitted']);
            foreach ($rows as $r) {
                fputcsv($out, array_map([$this, 'csvSafe'], [
                    $r->reference_no, $r->user?->name, $r->user?->purok, $r->documentType?->name, $r->purpose,
                    $r->status, $r->fee_amount, $r->is_paid ? 'Yes' : 'No',
                    $r->pickup_date?->format('Y-m-d'), $r->created_at->format('Y-m-d H:i'),
                ]));
            }
            fclose($out);
        }, "requests-{$stamp}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function filtered(Request $request)
    {
        $request->validate([
            'status'           => ['nullable', Rule::in(DocumentRequest::STATUSES)],
            'document_type_id' => ['nullable', 'integer'],
            'from'             => ['nullable', 'date'],
            'to'               => ['nullable', 'date'],
        ]);

        return DocumentRequest::query()
            ->with(['user:id,name,purok,contact_number,account_status', 'documentType:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('document_type_id'), fn ($q) => $q->where('document_type_id', $request->document_type_id))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->when($request->filled('q'), function ($q) use ($request) {
                $s = '%' . addcslashes($request->q, '%_\\') . '%';
                $q->where(fn ($w) => $w->where('reference_no', 'like', $s)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $s)));
            })
            ->latest('id');
    }

    /** Prevents spreadsheet formula injection from user-supplied text. */
    private function csvSafe($value): string
    {
        $value = (string) $value;
        return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
    }

    private function notifyResident(DocumentRequest $r, array $data): void
    {
        $doc = $r->documentType->name;
        [$title, $msg] = match ($r->status) {
            'under_review'     => ['Request under review', "Your request for {$doc} ({$r->reference_no}) is now being reviewed."],
            'approved'         => ['Request approved', "Your request for {$doc} ({$r->reference_no}) has been approved."],
            'rejected'         => ['Request rejected', "Your request for {$doc} ({$r->reference_no}) was rejected. Reason: {$r->rejection_reason}"],
            'ready_for_pickup' => ['Ready for pickup', "Your {$doc} ({$r->reference_no}) is ready. Pick it up at the barangay hall on {$r->pickup_date->format('M d, Y')} and bring a valid ID."],
            'released'         => ['Document released', "Your {$doc} ({$r->reference_no}) has been released. Thank you!"],
        };
        Notifier::toUser($r->user, $title, $msg, $r);
    }
}
