<?php

use App\Enums\Permission;
use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 50);
            $table->string('permission', 100);
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            $table->unique(['role', 'permission']);
        });

        // Seed the historical hardcoded role -> permission mapping so
        // behavior is unchanged until an admin edits it via Settings.
        $defaults = [
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

        $now = now();
        $rows = [];
        foreach ($defaults as $role => $permissions) {
            foreach (Permission::cases() as $permission) {
                $rows[] = [
                    'role' => $role,
                    'permission' => $permission->value,
                    'enabled' => in_array($permission, $permissions, true),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('role_permissions')->insert($rows);
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
