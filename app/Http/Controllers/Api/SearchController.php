<?php

namespace App\Http\Controllers\Api;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Models\Proforma;
use App\Models\ProformaRequest;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $term = trim((string) $request->string('q'));
        $user = $request->user();

        if (mb_strlen($term) < 2) {
            return response()->json(['suppliers' => [], 'requests' => [], 'proformas' => []]);
        }

        $like = "%{$term}%";

        $suppliers = $user->canPermission(Permission::SUPPLIERS_VIEW)
            ? Supplier::where('legal_name', 'like', $like)
                ->orWhere('trade_name', 'like', $like)
                ->orWhere('tin', 'like', $like)
                ->limit(5)
                ->get(['id', 'legal_name', 'trade_name'])
                ->map(fn ($s) => ['id' => $s->id, 'legalName' => $s->legal_name, 'tradeName' => $s->trade_name])
            : collect();

        $requests = $user->canPermission(Permission::REQUESTS_VIEW)
            ? ProformaRequest::where('title', 'like', $like)
                ->orWhere('reference_no', 'like', $like)
                ->limit(5)
                ->get(['id', 'reference_no', 'title'])
                ->map(fn ($r) => ['id' => $r->id, 'referenceNo' => $r->reference_no, 'title' => $r->title])
            : collect();

        $proformas = $user->canPermission(Permission::PROFORMAS_VIEW)
            ? Proforma::with('supplier:id,legal_name')
                ->where('reference_no', 'like', $like)
                ->orWhereHas('supplier', fn ($q) => $q->where('legal_name', 'like', $like))
                ->limit(5)
                ->get()
                ->map(fn ($p) => ['id' => $p->id, 'referenceNo' => $p->reference_no, 'supplierName' => $p->supplier?->legal_name])
            : collect();

        return response()->json([
            'suppliers' => $suppliers->values(),
            'requests' => $requests->values(),
            'proformas' => $proformas->values(),
        ]);
    }
}
