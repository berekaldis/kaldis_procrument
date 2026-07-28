<?php

namespace App\Services;

use App\Enums\Permission;
use App\Enums\UserRole;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RoleService
{
    public const CACHE_KEY = 'role_permissions_matrix';

    /**
     * Role -> enabled Permission[] matrix, sourced from the role_permissions
     * table so admins can edit it from Settings > Permissions. Falls back to
     * the historical hardcoded defaults if the table is empty (fresh install
     * before migrations seed it, or the table was cleared).
     *
     * @return array<string, Permission[]>
     */
    public static function map(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            $rows = DB::table('role_permissions')->where('enabled', true)->get(['role', 'permission']);

            if ($rows->isEmpty()) {
                return self::defaults();
            }

            $map = [];
            foreach ($rows as $row) {
                $permission = Permission::tryFrom($row->permission);
                if ($permission === null) {
                    continue;
                }
                $map[$row->role][] = $permission;
            }

            // Admin always has every permission, regardless of what's
            // stored — protects against an admin accidentally locking
            // themselves (and everyone else) out via the permission grid.
            $map[UserRole::ADMIN->value] = Permission::cases();

            return $map;
        });
    }

    public static function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, Permission[]>
     */
    public static function defaults(): array
    {
        return [
            UserRole::ADMIN->value => Permission::cases(),
            UserRole::PURCHASER->value => [
                Permission::DASHBOARD_VIEW,
                Permission::SUPPLIERS_VIEW,
                Permission::SUPPLIERS_MANAGE,
                Permission::REQUESTS_VIEW,
                Permission::REQUESTS_CREATE,
                Permission::REQUESTS_SEND,
                Permission::REQUESTS_MANAGE,
                Permission::PROFORMAS_VIEW,
                Permission::PROFORMAS_REVIEW,
                Permission::NOTIFICATIONS_VIEW,
                Permission::AUDIT_VIEW,
            ],
            UserRole::FINANCE->value => [
                Permission::DASHBOARD_VIEW,
                Permission::PROFORMAS_VIEW,
                Permission::PROFORMAS_REVIEW,
                Permission::NOTIFICATIONS_VIEW,
                Permission::AUDIT_VIEW,
            ],
            UserRole::REQUESTER->value => [
                Permission::DASHBOARD_VIEW,
                Permission::SUPPLIERS_VIEW,
                Permission::REQUESTS_VIEW,
                Permission::REQUESTS_CREATE,
                Permission::NOTIFICATIONS_VIEW,
            ],
        ];
    }

    /**
     * @return Permission[]
     */
    public static function permissions(string $role): array
    {
        return self::map()[$role] ?? [];
    }

    public static function can(string $role, Permission $permission): bool
    {
        return in_array($permission, self::permissions($role), true);
    }

    /**
     * Resolve a dotted permission string ('suppliers.manage') and check.
     */
    public static function canDotted(string $role, string $dotted): bool
    {
        $perm = Permission::fromDotted($dotted);
        if (! $perm instanceof Permission) {
            return false;
        }

        return self::can($role, $perm);
    }
}
