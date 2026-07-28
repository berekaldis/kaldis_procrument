<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Proforma;
use App\Models\ProformaRequest;
use App\Models\Supplier;
use App\Models\TelegramOutbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $now = now();

        $totalSuppliers = Supplier::count();
        $verifiedSuppliers = Supplier::where('verification_status', 'verified')->count();
        $totalRequests = ProformaRequest::count();
        $openRequests = ProformaRequest::whereIn('status', ['sent', 'partially_received', 'partial'])->count();
        $totalProformas = Proforma::count();
        $pendingProformas = Proforma::where('status', 'received')->count();
        $telegramLinkedSuppliers = Supplier::whereNotNull('telegram_chat_id')->where('telegram_chat_id', '!=', '')->count();
        $outboxCount = TelegramOutbox::count();

        $overdueRequests = ProformaRequest::whereIn('status', ['sent', 'partially_received', 'partial'])
            ->where('deadline', '<', $now)
            ->count();

        // Average turnaround (request creation → first proforma received_at) for
        // requests that have at least one proforma, within the last 30 days.
        $avgTurnaroundHours = null;
        $last30 = now()->subDays(30);
        $turnarounds = DB::table('proforma_requests')
            ->join('proformas', 'proformas.request_id', '=', 'proforma_requests.id')
            ->where('proforma_requests.created_at', '>=', $last30)
            ->select('proforma_requests.created_at as request_created_at', 'proformas.received_at as proforma_received_at')
            ->get();
        if ($turnarounds->isNotEmpty()) {
            $hours = $turnarounds->map(
                fn ($row) => \Carbon\Carbon::parse($row->request_created_at)->diffInMinutes(\Carbon\Carbon::parse($row->proforma_received_at)) / 60
            );
            $avgTurnaroundHours = round($hours->avg(), 1);
        }

        $recentRequests = ProformaRequest::withCount(['requestSuppliers as supplier_count', 'proformas as proforma_count'])
            ->orderByDesc('id')->limit(6)->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'referenceNo' => $r->reference_no,
                'title' => $r->title,
                'status' => $r->status,
                'deadline' => $r->deadline?->toIso8601String(),
                'createdAt' => $r->created_at?->toIso8601String(),
                'supplierCount' => $r->supplier_count ?? 0,
                'proformaCount' => $r->proforma_count ?? 0,
            ]);

        $recentProformas = Proforma::with(['supplier:id,legal_name', 'request:id,reference_no,title'])
            ->orderByDesc('received_at')->limit(6)->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'supplierName' => $p->supplier?->legal_name,
                'requestRef' => $p->request?->reference_no,
                'requestTitle' => $p->request?->title,
                'fileName' => $p->file_name,
                'receivedVia' => $p->received_via,
                'status' => $p->status,
                'receivedAt' => $p->received_at?->toIso8601String(),
            ]);

        $upcomingDeadlines = ProformaRequest::whereIn('status', ['sent', 'partially_received', 'partial'])
            ->whereNotNull('deadline')
            ->where('deadline', '<=', $now->copy()->addDays(3))
            ->withCount(['requestSuppliers as supplier_count', 'proformas as proforma_count'])
            ->orderBy('deadline')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'referenceNo' => $r->reference_no,
                'title' => $r->title,
                'deadline' => $r->deadline?->toIso8601String(),
                'overdue' => $r->deadline?->isPast() ?? false,
                'supplierCount' => $r->supplier_count ?? 0,
                'proformaCount' => $r->proforma_count ?? 0,
            ]);

        $recentAudit = AuditLog::orderByDesc('id')->limit(8)->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'actor' => $a->actor,
                'entity' => $a->entity,
                'entityId' => $a->entity_id,
                'action' => $a->action,
                'details' => $a->details,
                'timestamp' => $a->timestamp?->toIso8601String(),
            ]);

        $requestsByStatus = ProformaRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count]);

        $proformasByStatus = Proforma::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')->get()
            ->map(fn ($p) => ['status' => $p->status, 'count' => (int) $p->count]);

        $suppliersByVerification = Supplier::select('verification_status', DB::raw('count(*) as count'))
            ->groupBy('verification_status')->get()
            ->map(fn ($s) => ['status' => $s->verification_status, 'count' => (int) $s->count]);

        return response()->json([
            'totalSuppliers' => $totalSuppliers,
            'verifiedSuppliers' => $verifiedSuppliers,
            'totalRequests' => $totalRequests,
            'openRequests' => $openRequests,
            'overdueRequests' => $overdueRequests,
            'totalProformas' => $totalProformas,
            'pendingProformas' => $pendingProformas,
            'telegramLinkedSuppliers' => $telegramLinkedSuppliers,
            'outboxCount' => $outboxCount,
            'avgTurnaroundHours' => $avgTurnaroundHours,
            'recentRequests' => $recentRequests,
            'recentProformas' => $recentProformas,
            'recentAudit' => $recentAudit,
            'upcomingDeadlines' => $upcomingDeadlines,
            'charts' => [
                'requestsByStatus' => $requestsByStatus,
                'proformasByStatus' => $proformasByStatus,
                'suppliersByVerification' => $suppliersByVerification,
            ],
        ]);
    }
}
