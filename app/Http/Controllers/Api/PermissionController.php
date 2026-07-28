<?php

namespace App\Http\Controllers\Api;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PermissionController extends Controller
{
    /**
     * Human-readable label + group per permission, for the Settings >
     * Permissions grid. Purely presentational — the enum itself remains
     * the source of truth for which permissions exist.
     */
    private const LABELS = [
        'dashboard.view' => ['label' => 'View dashboard', 'group' => 'Dashboard'],
        'suppliers.view' => ['label' => 'View suppliers', 'group' => 'Suppliers'],
        'suppliers.manage' => ['label' => 'Create / edit / delete suppliers', 'group' => 'Suppliers'],
        'suppliers.verify' => ['label' => 'Verify suppliers', 'group' => 'Suppliers'],
        'requests.view' => ['label' => 'View proforma requests', 'group' => 'Proforma Requests'],
        'requests.create' => ['label' => 'Create proforma requests', 'group' => 'Proforma Requests'],
        'requests.send' => ['label' => 'Send requests to suppliers', 'group' => 'Proforma Requests'],
        'requests.manage' => ['label' => 'Edit / delete requests', 'group' => 'Proforma Requests'],
        'proformas.view' => ['label' => 'View proformas', 'group' => 'Proformas'],
        'proformas.review' => ['label' => 'Review / accept / reject proformas', 'group' => 'Proformas'],
        'notifications.view' => ['label' => 'View notifications', 'group' => 'System'],
        'audit.view' => ['label' => 'View audit log', 'group' => 'System'],
        'outbox.view' => ['label' => 'View Telegram outbox', 'group' => 'System'],
        'settings.view' => ['label' => 'View settings', 'group' => 'Settings'],
        'settings.manage' => ['label' => 'Manage settings (Telegram, permissions)', 'group' => 'Settings'],
        'users.manage' => ['label' => 'Manage users & roles', 'group' => 'Users'],
    ];

    public function index(): JsonResponse
    {
        $permissions = collect(Permission::cases())->map(function (Permission $p) {
            $dotted = $p->value();
            $meta = self::LABELS[$dotted] ?? ['label' => $dotted, 'group' => 'Other'];

            return ['value' => $dotted, 'label' => $meta['label'], 'group' => $meta['group']];
        })->values();

        $editableRoles = collect(UserRole::cases())
            ->reject(fn (UserRole $r) => $r === UserRole::ADMIN)
            ->map(fn (UserRole $r) => ['value' => $r->value, 'label' => $r->label()])
            ->values();

        $rows = DB::table('role_permissions')->get(['role', 'permission', 'enabled']);
        $matrix = [];
        foreach ($editableRoles as $role) {
            foreach ($permissions as $perm) {
                $matrix[$role['value']][$perm['value']] = false;
            }
        }
        foreach ($rows as $row) {
            $dotted = str_replace('_', '.', $row->permission);
            if ($row->role === UserRole::ADMIN->value) {
                continue;
            }
            if (! isset($matrix[$row->role])) {
                continue;
            }
            $matrix[$row->role][$dotted] = (bool) $row->enabled;
        }

        return response()->json([
            'permissions' => $permissions,
            'roles' => $editableRoles,
            'matrix' => $matrix,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'string'],
            'permission' => ['required', 'string'],
            'enabled' => ['required', 'boolean'],
        ]);

        $role = UserRole::tryFrom($data['role']);
        if (! $role || $role === UserRole::ADMIN) {
            return response()->json(['error' => 'Administrator permissions cannot be changed.'], 422);
        }

        $permission = Permission::fromDotted($data['permission']);
        if (! $permission) {
            return response()->json(['error' => 'Unknown permission.'], 422);
        }

        DB::table('role_permissions')->updateOrInsert(
            ['role' => $role->value, 'permission' => $permission->value],
            ['enabled' => $data['enabled'], 'updated_at' => now()],
        );

        RoleService::forgetCache();

        app(AuditService::class)->log(
            $request->user()->name,
            'permission',
            $role->value.':'.$permission->value(),
            $data['enabled'] ? 'granted' : 'revoked',
            sprintf('%s "%s" %s for role "%s"', $data['enabled'] ? 'Granted' : 'Revoked', $permission->value(), $data['enabled'] ? 'to' : 'from', $role->label()),
        );

        return response()->json(['ok' => true]);
    }
}
