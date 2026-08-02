<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProformaRequestRequest;
use App\Http\Requests\UpdateProformaRequestRequest;
use App\Jobs\SendProformaRequestToSupplier;
use App\Models\Proforma;
use App\Models\ProformaRequest;
use App\Models\ProformaRequestItem;
use App\Models\ProformaRequestSupplier;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Services\ReferenceNumberService;
use App\Services\TelegramMessages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProformaRequestController extends Controller
{
    use Paginates;

    public function __construct(
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = ProformaRequest::query()
            ->withCount([
                'requestSuppliers as supplier_count',
                'proformas as proforma_count',
                'items as item_count',
            ]);

        if ($status = $request->input('status')) {
            $q->where('status', $status);
        }
        if ($term = $request->string('q')->toString()) {
            $q->where(function ($qq) use ($term) {
                $t = "%{$term}%";
                $qq->where('title', 'like', $t)
                    ->orWhere('reference_no', 'like', $t)
                    ->orWhere('description', 'like', $t)
                    ->orWhere('requested_by', 'like', $t);
            });
        }
        if ($from = $request->input('from')) {
            $q->where('created_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $q->where('created_at', '<=', $to);
        }

        $q->orderByDesc('id');
        [$requests, $meta] = $this->paginateOrLimit($q, $request);

        // Eager-load responded supplier IDs
        $ids = $requests->pluck('id');
        $responded = Proforma::whereIn('request_id', $ids)
            ->select('request_id', 'supplier_id')
            ->distinct()
            ->get()
            ->groupBy('request_id')
            ->map(fn ($rows) => $rows->pluck('supplier_id')->unique()->values());

        return $this->withPaginationHeaders(response()->json($requests->map(fn ($r) => $this->serializeList(
            $r,
            $responded->get($r->id) ?? collect(),
        ))), $meta);
    }

    public function store(StoreProformaRequestRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $pr = DB::transaction(function () use ($data, $user) {
            $reference = ReferenceNumberService::forProformaRequest();

            $pr = ProformaRequest::create([
                'organization_id' => $user->organization_id,
                'reference_no' => $reference,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'requested_by' => $user->name,
                'deadline' => $data['deadline'] ?? null,
                'status' => 'draft',
            ]);

            foreach ($data['items'] as $item) {
                ProformaRequestItem::create([
                    'request_id' => $pr->id,
                    'item_name' => $item['itemName'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'] ?? 'pcs',
                ]);
            }

            foreach ($data['supplierIds'] as $supplierId) {
                ProformaRequestSupplier::create([
                    'request_id' => $pr->id,
                    'supplier_id' => $supplierId,
                    'status' => 'pending',
                ]);
            }

            return $pr;
        });

        $this->audit->log(
            $user->name,
            'proforma_request',
            (string) $pr->id,
            'create',
            'Created proforma request '.$pr->reference_no.': "'.$pr->title.'"',
        );

        return response()->json($this->serializeDetailed($pr->fresh(['items', 'requestSuppliers.supplier', 'proformas.supplier'])), 201);
    }

    public function show(int $id): JsonResponse
    {
        $pr = ProformaRequest::with(['items', 'requestSuppliers.supplier', 'proformas.supplier'])
            ->withCount(['requestSuppliers', 'proformas', 'items'])
            ->findOrFail($id);

        return response()->json($this->serializeDetailed($pr));
    }

    public function clone(Request $request, int $id): JsonResponse
    {
        $source = ProformaRequest::with(['items', 'requestSuppliers'])->findOrFail($id);
        $user = $request->user();

        $clone = DB::transaction(function () use ($source, $user) {
            $pr = ProformaRequest::create([
                'organization_id' => $user->organization_id,
                'reference_no' => ReferenceNumberService::forProformaRequest(),
                'title' => $source->title,
                'description' => $source->description,
                'requested_by' => $user->name,
                'deadline' => now()->addDays(3),
                'status' => 'draft',
            ]);

            foreach ($source->items as $item) {
                ProformaRequestItem::create([
                    'request_id' => $pr->id,
                    'item_name' => $item->item_name,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                ]);
            }

            foreach ($source->requestSuppliers as $rs) {
                ProformaRequestSupplier::create([
                    'request_id' => $pr->id,
                    'supplier_id' => $rs->supplier_id,
                    'status' => 'pending',
                ]);
            }

            return $pr;
        });

        $this->audit->log(
            $user->name,
            'proforma_request',
            (string) $clone->id,
            'clone',
            'Cloned proforma request '.$source->reference_no.' into '.$clone->reference_no,
        );

        return response()->json($this->serializeDetailed($clone->fresh(['items', 'requestSuppliers.supplier', 'proformas.supplier'])), 201);
    }

    public function update(UpdateProformaRequestRequest $request, int $id): JsonResponse
    {
        $pr = ProformaRequest::findOrFail($id);
        $data = $request->validated();

        $update = [];
        if (isset($data['title'])) $update['title'] = $data['title'];
        if (array_key_exists('description', $data)) $update['description'] = $data['description'];
        if (array_key_exists('deadline', $data)) $update['deadline'] = $data['deadline'];
        if (isset($data['status'])) $update['status'] = $data['status'];
        $pr->update($update);

        $this->audit->log(
            $request->user()->name,
            'proforma_request',
            (string) $pr->id,
            'update',
            'Updated proforma request '.$pr->reference_no,
        );

        return response()->json($this->serializeDetailed($pr->fresh(['items', 'requestSuppliers.supplier', 'proformas.supplier'])));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $pr = ProformaRequest::findOrFail($id);
        $ref = $pr->reference_no;
        $pr->delete();

        $this->audit->log(
            $request->user()->name,
            'proforma_request',
            (string) $id,
            'delete',
            'Deleted proforma request '.$ref,
        );

        return response()->json(['ok' => true]);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $pr = ProformaRequest::with(['items', 'requestSuppliers.supplier'])->findOrFail($id);
        $user = $request->user();

        if ($pr->status !== 'draft' && $pr->status !== 'sent') {
            return response()->json([
                'error' => 'This request has already been sent (status: '.$pr->status.').',
            ], 422);
        }

        $items = $pr->items->values()->map(fn ($i, $idx) => sprintf('%d️⃣ <b>%s</b> (%s %s)', $idx + 1, $i->item_name, $i->quantity, $i->unit))->implode("\n");

        foreach ($pr->requestSuppliers as $rs) {
            $supplier = $rs->supplier;
            if (! $supplier) {
                continue;
            }

            $message = TelegramMessages::bilingualOutboundRequest([
                'ref' => $pr->reference_no,
                'title' => $pr->title,
                'items' => $items,
                'deadline' => $pr->deadline ? $pr->deadline->format('Y-m-d H:i') : 'N/A',
            ]);

            // Dispatched after response so Telegram HTTP round-trips execute immediately
            // without blocking the HTTP response or requiring a background queue worker.
            SendProformaRequestToSupplier::dispatchAfterResponse($rs->id, $message);
        }

        $pr->update(['status' => 'sent']);

        $this->notifications->create(
            null,
            'Proforma request sent',
            sprintf('"%s" (%s) was sent to %d supplier(s).', $pr->title, $pr->reference_no, $pr->requestSuppliers->count()),
            'info',
            '/requests',
        );

        $this->audit->log(
            $user->name,
            'proforma_request',
            (string) $pr->id,
            'send',
            'Sent proforma request '.$pr->reference_no.' to '.$pr->requestSuppliers->count().' supplier(s)',
        );

        return response()->json($this->serializeDetailed($pr->fresh(['items', 'requestSuppliers.supplier', 'proformas.supplier'])));
    }

    private function serializeList(ProformaRequest $r, $respondedSupplierIds): array
    {
        return [
            'id' => $r->id,
            'referenceNo' => $r->reference_no,
            'title' => $r->title,
            'description' => $r->description,
            'requestedBy' => $r->requested_by,
            'deadline' => $r->deadline?->toIso8601String(),
            'status' => $r->status,
            'supplierCount' => $r->supplier_count ?? 0,
            'proformaCount' => $r->proforma_count ?? 0,
            'itemCount' => $r->item_count ?? 0,
            'respondedSupplierIds' => $respondedSupplierIds->all(),
            'createdAt' => $r->created_at?->toIso8601String(),
            'updatedAt' => $r->updated_at?->toIso8601String(),
        ];
    }

    private function serializeDetailed(ProformaRequest $r): array
    {
        return [
            'id' => $r->id,
            'referenceNo' => $r->reference_no,
            'title' => $r->title,
            'description' => $r->description,
            'requestedBy' => $r->requested_by,
            'deadline' => $r->deadline?->toIso8601String(),
            'status' => $r->status,
            'items' => $r->items?->map(fn ($i) => [
                'id' => $i->id,
                'itemName' => $i->item_name,
                'description' => $i->description,
                'quantity' => (float) $i->quantity,
                'unit' => $i->unit,
            ]) ?? [],
            'suppliers' => $r->requestSuppliers?->map(fn ($rs) => [
                'id' => $rs->id,
                'status' => $rs->status,
                'notifiedAt' => $rs->notified_at?->toIso8601String(),
                'supplier' => $rs->supplier ? [
                    'id' => $rs->supplier->id,
                    'legalName' => $rs->supplier->legal_name,
                    'verificationStatus' => $rs->supplier->verification_status,
                    'telegramLinked' => ! empty($rs->supplier->telegram_chat_id),
                ] : null,
            ]) ?? [],
            'proformas' => $r->proformas?->map(fn ($p) => [
                'id' => $p->id,
                'status' => $p->status,
                'receivedVia' => $p->received_via,
                'referenceNo' => $p->reference_no,
                'message' => $p->message,
                'fileName' => $p->file_name,
                'filePath' => $p->file_path,
                'fileType' => $p->file_type,
                'receivedAt' => $p->received_at?->toIso8601String(),
                'supplier' => $p->supplier ? [
                    'id' => $p->supplier->id,
                    'legalName' => $p->supplier->legal_name,
                ] : null,
            ]) ?? [],
            'createdAt' => $r->created_at?->toIso8601String(),
            'updatedAt' => $r->updated_at?->toIso8601String(),
        ];
    }
}
