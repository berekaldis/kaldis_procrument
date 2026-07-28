<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    use Paginates;

    public function index(Request $request): JsonResponse
    {
        $q = AuditLog::query();

        if ($entity = $request->input('entity')) {
            $q->where('entity', $entity);
        }
        if ($action = $request->input('action')) {
            $q->where('action', $action);
        }
        if ($actor = $request->input('actor')) {
            $q->where('actor', 'like', "%{$actor}%");
        }
        if ($term = $request->string('q')->toString()) {
            $t = "%{$term}%";
            $q->where(function ($qq) use ($t) {
                $qq->where('actor', 'like', $t)
                    ->orWhere('entity', 'like', $t)
                    ->orWhere('action', 'like', $t)
                    ->orWhere('details', 'like', $t);
            });
        }
        if ($from = $request->input('from')) {
            $q->where('timestamp', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $q->where('timestamp', '<=', $to);
        }

        $q->orderByDesc('timestamp');
        $limit = (int) ($request->input('limit') ?: 200);
        [$logs, $meta] = $this->paginateOrLimit($q, $request, $limit);

        return $this->withPaginationHeaders(response()->json($logs->map(fn ($a) => [
            'id' => $a->id,
            'actor' => $a->actor,
            'entity' => $a->entity,
            'entityId' => $a->entity_id,
            'action' => $a->action,
            'details' => $a->details,
            'timestamp' => $a->timestamp?->toIso8601String(),
        ])), $meta);
    }
}
