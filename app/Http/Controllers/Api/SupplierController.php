<?php

namespace App\Http\Controllers\Api;

use App\Enums\Permission;
use App\Http\Controllers\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Category;
use App\Models\Supplier;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    use Paginates;

    /** @var array<string,string> Map camelCase input → snake_case column */
    private const FIELDS = [
        'legalName' => 'legal_name',
        'tradeName' => 'trade_name',
        'tradeLicenseNo' => 'trade_license_no',
        'tin' => 'tin',
        'vatNo' => 'vat_no',
        'categoryTags' => 'category_tags',
        'contactName' => 'contact_name',
        'contactPhone' => 'contact_phone',
        'contactEmail' => 'contact_email',
        'telegramChatId' => 'telegram_chat_id',
        'telegramUsername' => 'telegram_username',
        'paymentTerms' => 'payment_terms',
        'bankDetails' => 'bank_details',
        'verificationStatus' => 'verification_status',
        'notes' => 'notes',
        'active' => 'active',
    ];

    public function __construct(
        private readonly AuditService $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = Supplier::query()
            ->withCount(['proformas', 'requestSuppliers as request_suppliers_count'])
            ->search($request->string('q')->toString() ?: null);

        // Accept either camelCase (verificationStatus) or snake_case (verification_status)
        if ($status = $request->input('verification_status', $request->input('verificationStatus'))) {
            $q->where('verification_status', $status);
        }
        if ($request->has('telegram_linked') || $request->has('telegramLinked')) {
            $linkedRaw = $request->input('telegram_linked', $request->input('telegramLinked'));
            $linked = filter_var($linkedRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($linked === true) {
                $q->whereNotNull('telegram_chat_id')->where('telegram_chat_id', '!=', '');
            } elseif ($linked === false) {
                $q->where(function ($qq) {
                    $qq->whereNull('telegram_chat_id')->orWhere('telegram_chat_id', '');
                });
            }
        }
        if ($category = $request->input('category')) {
            $q->where('category_tags', 'like', "%{$category}%");
        }

        $q->orderByDesc('id');
        [$suppliers, $meta] = $this->paginateOrLimit($q, $request);

        return $this->withPaginationHeaders(
            response()->json($suppliers->map(fn ($s) => $this->serialize($s))),
            $meta,
        );
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $data = $this->mapFields($request->validated());
        if (! isset($data['verification_status'])) {
            $data['verification_status'] = 'unverified';
        }
        $supplier = Supplier::create($data);

        $this->audit->log(
            $request->user()->name,
            'supplier',
            (string) $supplier->id,
            'create',
            'Created supplier "'.$supplier->legal_name.'"',
        );

        return response()->json(['ok' => true, 'supplier' => $this->serialize($supplier->fresh())], 201);
    }

    public function show(int $id): JsonResponse
    {
        $supplier = Supplier::with(['documents', 'proformas' => fn ($q) => $q->orderByDesc('id')->limit(20)])
            ->withCount(['proformas', 'requestSuppliers'])
            ->findOrFail($id);

        return response()->json(['supplier' => $this->serialize($supplier, true)]);
    }

    public function update(UpdateSupplierRequest $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->update($this->mapFields($request->validated()));

        $this->audit->log(
            $request->user()->name,
            'supplier',
            (string) $supplier->id,
            'update',
            'Updated supplier "'.$supplier->legal_name.'"',
        );

        return response()->json(['ok' => true, 'supplier' => $this->serialize($supplier->fresh())]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        $name = $supplier->legal_name;

        DB::transaction(function () use ($id, $supplier) {
            DB::table('proforma_request_suppliers')->where('supplier_id', $id)->delete();
            DB::table('proformas')->where('supplier_id', $id)->delete();
            DB::table('supplier_documents')->where('supplier_id', $id)->delete();
            DB::table('telegram_outbox')->where('supplier_id', $id)->update(['supplier_id' => null]);
            $supplier->delete();
        });

        $this->audit->log(
            $request->user()->name,
            'supplier',
            (string) $id,
            'delete',
            'Deleted supplier "'.$name.'"',
        );

        return response()->json(['ok' => true]);
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:verified,documents_received,unverified'],
        ]);

        $supplier = Supplier::findOrFail($id);
        $old = $supplier->verification_status;
        $supplier->verification_status = $validated['status'];
        $supplier->save();

        $this->audit->log(
            $request->user()->name,
            'supplier',
            (string) $supplier->id,
            'verify',
            'Verification status changed from "'.$old.'" to "'.$validated['status'].'" for "'.$supplier->legal_name.'"',
        );

        return response()->json(['ok' => true, 'supplier' => $this->serialize($supplier->fresh())]);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:suppliers,id'],
            'action' => ['required', 'in:verify,documents_received,unverify,activate,deactivate,delete'],
        ]);

        $verificationActions = ['verify' => 'verified', 'documents_received' => 'documents_received', 'unverify' => 'unverified'];
        $user = $request->user();

        if (isset($verificationActions[$data['action']]) && ! $user->canPermission(Permission::SUPPLIERS_VERIFY)) {
            return response()->json(['error' => 'Forbidden — this action requires the suppliers.verify permission.'], 403);
        }
        if (in_array($data['action'], ['activate', 'deactivate', 'delete'], true) && ! $user->canPermission(Permission::SUPPLIERS_MANAGE)) {
            return response()->json(['error' => 'Forbidden — this action requires the suppliers.manage permission.'], 403);
        }

        if ($data['action'] === 'delete') {
            DB::transaction(function () use ($data) {
                DB::table('proforma_request_suppliers')->whereIn('supplier_id', $data['ids'])->delete();
                DB::table('proformas')->whereIn('supplier_id', $data['ids'])->delete();
                DB::table('supplier_documents')->whereIn('supplier_id', $data['ids'])->delete();
                DB::table('telegram_outbox')->whereIn('supplier_id', $data['ids'])->update(['supplier_id' => null]);
                Supplier::whereIn('id', $data['ids'])->delete();
            });
        } elseif (isset($verificationActions[$data['action']])) {
            Supplier::whereIn('id', $data['ids'])->update(['verification_status' => $verificationActions[$data['action']]]);
        } else {
            Supplier::whereIn('id', $data['ids'])->update(['active' => $data['action'] === 'activate']);
        }

        $this->audit->log(
            $user->name,
            'supplier',
            implode(',', $data['ids']),
            'bulk_'.$data['action'],
            sprintf('Bulk "%s" applied to %d supplier(s).', $data['action'], count($data['ids'])),
        );

        return response()->json(['ok' => true, 'count' => count($data['ids'])]);
    }

    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'duplicateMode' => ['nullable', 'string', 'in:skip,update,create_always'],
            'suppliers' => ['required', 'array', 'min:1'],
            'suppliers.*.legalName' => ['required', 'string', 'max:255'],
            'suppliers.*.tradeName' => ['nullable', 'string', 'max:255'],
            'suppliers.*.tin' => ['nullable', 'string', 'max:100'],
            'suppliers.*.contactName' => ['nullable', 'string', 'max:255'],
            'suppliers.*.contactPhone' => ['nullable', 'string', 'max:100'],
            'suppliers.*.bankDetails' => ['nullable', 'string', 'max:500'],
            'suppliers.*.notes' => ['nullable', 'string', 'max:1000'],
            'suppliers.*.categoryTags' => ['nullable', 'string', 'max:255'],
        ]);

        $duplicateMode = $validated['duplicateMode'] ?? 'skip';
        $orgId = $request->user()->organization_id;
        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $newCategoriesCount = 0;

        DB::transaction(function () use (
            $validated,
            $duplicateMode,
            $orgId,
            &$importedCount,
            &$updatedCount,
            &$skippedCount,
            &$newCategoriesCount
        ) {
            foreach ($validated['suppliers'] as $supData) {
                $legalName = trim($supData['legalName']);
                $tin = isset($supData['tin']) ? trim($supData['tin']) : null;
                $categoryTags = isset($supData['categoryTags']) ? trim($supData['categoryTags']) : '';

                // Ensure category exists in categories table if provided
                if (! empty($categoryTags)) {
                    $catNames = array_map('trim', explode(',', $categoryTags));
                    foreach ($catNames as $catName) {
                        if (! empty($catName)) {
                            $cat = Category::where('name', $catName)->first();
                            if (! $cat) {
                                Category::create([
                                    'organization_id' => $orgId,
                                    'name' => $catName,
                                ]);
                                $newCategoriesCount++;
                            }
                        }
                    }
                }

                // Check for existing supplier by TIN (if non-empty) or Legal Name
                $existing = null;
                if (! empty($tin)) {
                    $existing = Supplier::where('tin', $tin)->first();
                }
                if (! $existing) {
                    $existing = Supplier::where('legal_name', $legalName)->first();
                }

                $mapped = [
                    'organization_id' => $orgId,
                    'legal_name' => $legalName,
                    'trade_name' => $supData['tradeName'] ?? null,
                    'tin' => $tin ?: null,
                    'contact_name' => $supData['contactName'] ?? null,
                    'contact_phone' => $supData['contactPhone'] ?? null,
                    'bank_details' => $supData['bankDetails'] ?? null,
                    'notes' => $supData['notes'] ?? null,
                    'category_tags' => $categoryTags ?: null,
                    'verification_status' => 'unverified',
                ];

                if ($existing) {
                    if ($duplicateMode === 'skip') {
                        $skippedCount++;
                        continue;
                    } elseif ($duplicateMode === 'update') {
                        $existing->update(array_filter($mapped, fn ($v) => $v !== null));
                        $updatedCount++;
                        continue;
                    }
                }

                Supplier::create($mapped);
                $importedCount++;
            }
        });

        $this->audit->log(
            $request->user()->name,
            'supplier',
            'import',
            'import',
            sprintf('Imported %d new supplier(s), updated %d, skipped %d from Excel.', $importedCount, $updatedCount, $skippedCount),
        );

        return response()->json([
            'ok' => true,
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'skipped_count' => $skippedCount,
            'new_categories_count' => $newCategoriesCount,
        ]);
    }

    private function mapFields(array $validated): array
    {
        $out = [];
        foreach (self::FIELDS as $camel => $snake) {
            if (array_key_exists($camel, $validated)) {
                $out[$snake] = $validated[$camel];
            }
        }

        return $out;
    }

    private function serialize(Supplier $s, bool $detailed = false): array
    {
        $base = [
            'id' => $s->id,
            'organizationId' => $s->organization_id,
            'legalName' => $s->legal_name,
            'tradeName' => $s->trade_name,
            'tradeLicenseNo' => $s->trade_license_no,
            'tin' => $s->tin,
            'vatNo' => $s->vat_no,
            'categoryTags' => $s->category_tags,
            'contactName' => $s->contact_name,
            'contactPhone' => $s->contact_phone,
            'contactEmail' => $s->contact_email,
            'telegramChatId' => $s->telegram_chat_id,
            'telegramUsername' => $s->telegram_username,
            'language' => $s->language,
            'paymentTerms' => $s->payment_terms,
            'bankDetails' => $s->bank_details,
            'verificationStatus' => $s->verification_status,
            'notes' => $s->notes,
            'active' => (bool) $s->active,
            'telegramLinked' => ! empty($s->telegram_chat_id),
            'proformaCount' => $s->proformas_count ?? null,
            'requestCount' => $s->request_suppliers_count ?? null,
            'createdAt' => $s->created_at?->toIso8601String(),
            'updatedAt' => $s->updated_at?->toIso8601String(),
        ];

        if ($detailed) {
            $base['documents'] = $s->documents?->map(fn ($d) => [
                'id' => $d->id,
                'fileName' => $d->file_name,
                'filePath' => $d->file_path,
                'fileType' => $d->file_type,
            ]) ?? [];
            $base['recentProformas'] = $s->proformas?->map(fn ($p) => [
                'id' => $p->id,
                'referenceNo' => $p->reference_no,
                'status' => $p->status,
                'receivedVia' => $p->received_via,
                'receivedAt' => $p->received_at?->toIso8601String(),
            ]) ?? [];
        }

        return $base;
    }
}
