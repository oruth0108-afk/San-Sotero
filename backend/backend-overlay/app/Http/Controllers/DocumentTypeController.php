<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentTypeRequest;
use App\Models\DocumentType;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DocumentTypeController extends Controller
{
    /** Residents see active types only; staff may pass ?all=1 to include inactive ones. */
    public function index(Request $request)
    {
        $query = DocumentType::query()->orderBy('name');

        if ($request->user()->isStaffMember()) {
            $query->withCount('requests');
            if (!$request->boolean('all')) {
                $query->active();
            }
        } else {
            $query->active();
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(DocumentTypeRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['required_attachments'] = $data['required_attachments'] ?? [];
        $type = DocumentType::create($data);

        ActivityLogger::log('document_type_created', "Created document type: {$type->name}", $type);
        return response()->json(['data' => $type], 201);
    }

    public function update(DocumentTypeRequest $request, DocumentType $documentType)
    {
        $data = $request->validated();
        $data['required_attachments'] = $data['required_attachments'] ?? [];
        $documentType->update($data);

        ActivityLogger::log('document_type_updated', "Updated document type: {$documentType->name}", $documentType);
        return response()->json(['data' => $documentType]);
    }

    public function destroy(DocumentType $documentType)
    {
        if ($documentType->requests()->exists()) {
            return response()->json(['message' => 'This document type already has requests. Mark it inactive instead of deleting it.'], 422);
        }

        ActivityLogger::log('document_type_deleted', "Deleted document type: {$documentType->name}", $documentType);
        $documentType->delete();
        return response()->json(['message' => 'Document type deleted.']);
    }

    private function uniqueSlug(string $name): string
    {
        $slug = $base = Str::slug($name);
        $i = 2;
        while (DocumentType::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
