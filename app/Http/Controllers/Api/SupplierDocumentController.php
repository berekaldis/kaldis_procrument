<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupplierDocumentController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function store(Request $request, int $supplierId): JsonResponse
    {
        $supplier = Supplier::findOrFail($supplierId);

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx'],
        ]);

        $file = $request->file('file');
        $original = $file->getClientOriginalName();
        $stored = Str::random(12).'_'.preg_replace('/[^A-Za-z0-9._-]/', '_', $original);
        $file->move(public_path('supplier-documents'), $stored);

        $document = SupplierDocument::create([
            'supplier_id' => $supplier->id,
            'file_name' => $original,
            'file_path' => 'supplier-documents/'.$stored,
            'file_type' => $file->getClientMimeType(),
        ]);

        $this->audit->log(
            $request->user()->name,
            'supplier',
            (string) $supplier->id,
            'document_upload',
            'Uploaded document "'.$original.'" for supplier "'.$supplier->legal_name.'"',
        );

        return response()->json([
            'id' => $document->id,
            'fileName' => $document->file_name,
            'filePath' => $document->file_path,
            'fileType' => $document->file_type,
        ], 201);
    }

    public function destroy(Request $request, int $supplierId, int $documentId): JsonResponse
    {
        $document = SupplierDocument::where('supplier_id', $supplierId)->findOrFail($documentId);
        $name = $document->file_name;
        $supplier = $document->supplier;
        $document->delete();

        $this->audit->log(
            $request->user()->name,
            'supplier',
            (string) $supplierId,
            'document_delete',
            'Deleted document "'.$name.'" from supplier "'.($supplier->legal_name ?? $supplierId).'"',
        );

        return response()->json(['ok' => true]);
    }
}
