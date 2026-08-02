<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreManualProformaRequest;
use App\Http\Requests\UpdateProformaRequest;
use App\Models\Proforma;
use App\Models\ProformaRequest;
use App\Models\Supplier;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Services\ProformaIngestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProformaController extends Controller
{
    use Paginates;

    public function __construct(
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
        private readonly ProformaIngestService $ingest,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = Proforma::with(['supplier:id,legal_name,verification_status', 'request:id,reference_no,title,status,deadline']);

        if ($requestId = $request->input('requestId')) {
            $q->where('proformas.request_id', $requestId);
        }
        if ($supplierId = $request->input('supplierId')) {
            $q->where('proformas.supplier_id', $supplierId);
        }
        if ($status = $request->input('status')) {
            $q->where('proformas.status', $status);
        }
        if ($term = $request->string('q')->toString()) {
            $t = "%{$term}%";
            $q->where(function ($qq) use ($t) {
                $qq->where('proformas.reference_no', 'like', $t)
                    ->orWhere('proformas.message', 'like', $t)
                    ->orWhereHas('supplier', fn ($s) => $s->where('legal_name', 'like', $t))
                    ->orWhereHas('request', fn ($r) => $r->where('reference_no', 'like', $t)->orWhere('title', 'like', $t));
            });
        }
        if ($from = $request->input('from')) {
            $q->where('proformas.received_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $q->where('proformas.received_at', '<=', $to);
        }

        $q->orderByDesc('proformas.received_at');
        [$proformas, $meta] = $this->paginateOrLimit($q, $request);

        return $this->withPaginationHeaders(
            response()->json($proformas->map(fn ($p) => $this->serialize($p))),
            $meta,
        );
    }

    public function show(int $id): JsonResponse
    {
        $p = Proforma::with(['supplier', 'request.items'])
            ->findOrFail($id);

        return response()->json($this->serialize($p, true));
    }

    public function update(UpdateProformaRequest $request, int $id): JsonResponse
    {
        $p = Proforma::findOrFail($id);
        $validated = $request->validated();
        $old = $p->status;

        if (isset($validated['items'])) {
            $validated['total_amount'] = collect($validated['items'])
                ->sum(fn ($i) => (float) $i['quantity'] * (float) $i['unitPrice']);
        } elseif ($request->has('total_amount') || $request->has('totalAmount')) {
            $validated['total_amount'] = $request->input('total_amount', $request->input('totalAmount'));
        }

        $p->update($validated);

        if (isset($validated['status']) && $validated['status'] !== $old) {
            $this->audit->log(
                $request->user()->name,
                'proforma',
                (string) $p->id,
                'status_change',
                'Proforma #'.$p->id.' status changed from "'.$old.'" to "'.$validated['status'].'"',
            );
        }

        return response()->json($this->serialize($p->fresh(['supplier', 'request'])));
    }

    public function manual(StoreManualProformaRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $supplier = Supplier::findOrFail($data['supplierId']);
        $pr = ProformaRequest::findOrFail($data['requestId']);

        $filePath = null;
        $fileName = null;
        $fileType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $stored = Str::random(12).'_'.preg_replace('/[^A-Za-z0-9._-]/', '_', $fileName);
            $file->move(public_path('proformas'), $stored);
            $filePath = 'proformas/'.$stored;
            $fileType = $file->getClientMimeType();
        }

        $items = $data['items'] ?? null;
        $totalAmount = $items ? collect($items)->sum(fn ($i) => (float) $i['quantity'] * (float) $i['unitPrice']) : null;

        $p = $this->ingest->receive($pr, $supplier, [
            'reference_no' => 'MAN-'.strtoupper(substr(md5(uniqid('', true)), 0, 8)),
            'message' => $data['message'] ?? null,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_type' => $fileType,
            'received_via' => 'manual',
            'notes' => $data['notes'] ?? null,
            'items' => $items,
            'total_amount' => $totalAmount,
        ], $user->name);

        return response()->json($this->serialize($p->fresh(['supplier', 'request'])), 201);
    }

    private function serialize(Proforma $p, bool $detailed = false): array
    {
        $base = [
            'id' => $p->id,
            'requestId' => $p->request_id,
            'supplierId' => $p->supplier_id,
            'referenceNo' => $p->reference_no,
            'message' => $p->message,
            'filePath' => $p->file_path,
            'fileName' => $p->file_name,
            'fileType' => $p->file_type,
            'telegramMessageId' => $p->telegram_message_id,
            'receivedVia' => $p->received_via,
            'status' => $p->status,
            'notes' => $p->notes,
            'items' => $p->items,
            'totalAmount' => $p->total_amount !== null ? (float) $p->total_amount : null,
            'currency' => $p->currency,
            'receivedAt' => $p->received_at?->toIso8601String(),
            'createdAt' => $p->created_at?->toIso8601String(),
            'updatedAt' => $p->updated_at?->toIso8601String(),
            'supplier' => $p->supplier ? [
                'id' => $p->supplier->id,
                'legalName' => $p->supplier->legal_name,
                'verificationStatus' => $p->supplier->verification_status,
            ] : null,
            'request' => $p->request ? [
                'id' => $p->request->id,
                'referenceNo' => $p->request->reference_no,
                'title' => $p->request->title,
                'status' => $p->request->status,
                'deadline' => $p->request->deadline?->toIso8601String(),
            ] : null,
        ];

        if ($detailed && $p->request) {
            $base['request']['items'] = $p->request->items?->map(fn ($i) => [
                'id' => $i->id,
                'itemName' => $i->item_name,
                'description' => $i->description,
                'quantity' => (float) $i->quantity,
                'unit' => $i->unit,
            ]) ?? [];
        }

        return $base;
    }
}
