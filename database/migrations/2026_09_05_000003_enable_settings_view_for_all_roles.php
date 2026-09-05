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

        foreach ($roles as $role) {
            DB::table('role_permissions')->updateOrInsert(
                ['role' => $role, 'permission' => 'settings_view'],
                [
                    'enabled' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        Cache::forget(RoleService::CACHE_KEY);
    }

    public function down(): void
    {
        Cache::forget(RoleService::CACHE_KEY);
    }
};
