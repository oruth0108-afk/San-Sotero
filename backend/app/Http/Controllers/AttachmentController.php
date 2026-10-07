<?php

namespace App\Http\Controllers;

use App\Models\RequestAttachment;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    /** Attachments live on a private disk; they are only streamed to the owner or to barangay staff. */
    public function show(RequestAttachment $attachment)
    {
        Gate::authorize('view', $attachment->request);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404, 'File not found.');

        return Storage::disk('local')->response($attachment->path, $attachment->original_name, [
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
