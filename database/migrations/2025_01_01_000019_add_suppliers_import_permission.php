<?php

use App\Enums\Permission;
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

        foreach ($roles as $role) {
            // Enabled by default for ADMIN and PURCHASER
            $enabled = in_array($role, [UserRole::ADMIN->value, UserRole::PURCHASER->value], true);

            DB::table('role_permissions')->updateOrInsert(
                ['role' => $role, 'permission' => 'suppliers_import'],
                [
                    'enabled' => $enabled,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        Cache::forget(RoleService::CACHE_KEY);
    }

    public function down(): void
    {
        DB::table('role_permissions')->where('permission', 'suppliers_import')->delete();
        Cache::forget(RoleService::CACHE_KEY);
    }
};
