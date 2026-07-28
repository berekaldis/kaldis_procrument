<?php

namespace App\Enums;

enum Permission: string
{
    case DASHBOARD_VIEW = 'dashboard_view';
    case SUPPLIERS_VIEW = 'suppliers_view';
    case SUPPLIERS_MANAGE = 'suppliers_manage';
    case SUPPLIERS_VERIFY = 'suppliers_verify';
    case REQUESTS_VIEW = 'requests_view';
    case REQUESTS_CREATE = 'requests_create';
    case REQUESTS_SEND = 'requests_send';
    case REQUESTS_MANAGE = 'requests_manage';
    case PROFORMAS_VIEW = 'proformas_view';
    case PROFORMAS_REVIEW = 'proformas_review';
    case NOTIFICATIONS_VIEW = 'notifications_view';
    case AUDIT_VIEW = 'audit_view';
    case OUTBOX_VIEW = 'outbox_view';
    case SETTINGS_VIEW = 'settings_view';
    case SETTINGS_MANAGE = 'settings_manage';
    case USERS_MANAGE = 'users_manage';

    /**
     * Return the dotted string form (e.g. 'suppliers.manage') used by
     * the React frontend permission matrix.
     */
    public function value(): string
    {
        return str_replace('_', '.', $this->value);
    }

    /**
     * Resolve a dotted string ('suppliers.manage') back to a Permission case.
     */
    public static function fromDotted(string $dotted): ?self
    {
        $key = str_replace('.', '_', $dotted);

        return self::tryFrom($key);
    }
}
