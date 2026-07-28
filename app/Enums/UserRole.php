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
            self::PURCHASER => 'Purchaser',
            self::FINANCE => 'Finance',
            self::REQUESTER => 'Requester',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ADMIN => 'Full system access — manage users, suppliers, requests, proformas, audit, and settings.',
            self::PURCHASER => 'Manage supplier database, create and send proforma requests, review proformas.',
            self::FINANCE => 'Review and accept/reject proformas, view dashboard, audit, and notifications.',
            self::REQUESTER => 'Create proforma requests, view suppliers, dashboard, and notifications.',
        };
    }
}
