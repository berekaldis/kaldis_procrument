<?php

use App\Enums\UserRole;
use App\Services\RoleService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $roles = [
            UserRole::ADMIN->value,
            UserRole::PURCHASER->value,
            UserRole::FINANCE->value,
            UserRole::REQUESTER->value,
        ];

        $newPermissions = [
            'requests_edit' => [UserRole::ADMIN->value, UserRole::PURCHASER->value],
            'requests_delete' => [UserRole::ADMIN->value, UserRole::PURCHASER->value],
            'proformas_edit' => [UserRole::ADMIN->value, UserRole::PURCHASER->value, UserRole::FINANCE->value],
            'proformas_delete' => [UserRole::ADMIN->value, UserRole::PURCHASER->value, UserRole::FINANCE->value],
        ];

        foreach ($newPermissions as $perm => $enabledRoles) {
            foreach ($roles as $role) {
                $enabled = in_array($role, $enabledRoles, true);
                DB::table('role_permissions')->updateOrInsert(
                    ['role' => $role, 'permission' => $perm],
                    [
                        'enabled' => $enabled,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        Cache::forget(RoleService::CACHE_KEY);
    }

    public function down(): void
    {
        DB::table('role_permissions')
            ->whereIn('permission', ['requests_edit', 'requests_delete', 'proformas_edit', 'proformas_delete'])
            ->delete();
        Cache::forget(RoleService::CACHE_KEY);
    }
};
