<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case PURCHASER = 'purchaser';
    case FINANCE = 'finance';
    case REQUESTER = 'requester';

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Administrator',
            self::PURCHASER => 'Purchase Manager',
            self::FINANCE => 'Finance',
            self::REQUESTER => 'Proforma Requester',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ADMIN => 'Full system access — manage users, suppliers, requests, proformas, audit, and settings.',
            self::PURCHASER => 'Manage suppliers, approve proforma requests to send to selected suppliers, and review proformas.',
            self::FINANCE => 'Review and accept/reject proformas, view dashboard, audit, and notifications.',
            self::REQUESTER => 'Mainly request proformas (create proforma requests for Purchase Manager approval).',
        };
    }
}
