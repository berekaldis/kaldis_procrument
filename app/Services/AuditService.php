<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    public function log(
        string $actor,
        string $entity,
        string|int $entityId,
        string $action,
        ?string $details = null,
    ): AuditLog {
        return AuditLog::create([
            'actor' => $actor,
            'entity' => $entity,
            'entity_id' => (string) $entityId,
            'action' => $action,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }
}
