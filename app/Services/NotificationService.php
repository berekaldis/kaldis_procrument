<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    public function create(
        ?string $role,
        string $title,
        string $message,
        string $type = 'info',
        ?string $link = null,
    ): Notification {
        return Notification::create([
            'role' => $role,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'read' => false,
            'link' => $link,
        ]);
    }
}
