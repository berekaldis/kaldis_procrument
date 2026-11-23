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
     * Human-readable label + module group per permission, categorized like the Company System.
     */
    private const LABELS = [
        'dashboard.view' => ['label' => 'View Dashboard & KPIs', 'group' => 'Dashboard & Analytics'],
        'reports.view' => ['label' => 'View Procurement Reports & Analytics', 'group' => 'Dashboard & Analytics'],

        'suppliers.view' => ['label' => 'View Supplier Directory', 'group' => 'Suppliers & Categories'],
        'suppliers.manage' => ['label' => 'Create, Edit & Delete Suppliers', 'group' => 'Suppliers & Categories'],
        'suppliers.verify' => ['label' => 'Verify Suppliers & Approve Documents', 'group' => 'Suppliers & Categories'],
        'suppliers.import' => ['label' => 'Bulk Import Suppliers (Excel / CSV)', 'group' => 'Suppliers & Categories'],
        'categories.manage' => ['label' => 'Manage Product & Supplier Categories', 'group' => 'Suppliers & Categories'],

        'requests.view' => ['label' => 'View Proforma Requests (RFQs)', 'group' => 'Proforma Requests'],
        'requests.create' => ['label' => 'Create New Proforma Requests', 'group' => 'Proforma Requests'],
        'requests.send' => ['label' => 'Dispatch RFQs to Suppliers via Telegram', 'group' => 'Proforma Requests'],
        'requests.edit' => ['label' => 'Edit Existing Proforma Requests', 'group' => 'Proforma Requests'],
        'requests.delete' => ['label' => 'Delete Proforma Requests', 'group' => 'Proforma Requests'],
        'requests.manage' => ['label' => 'Full Administrative Control over Requests', 'group' => 'Proforma Requests'],

        'proformas.view' => ['label' => 'View Received Proforma Quotations', 'group' => 'Proforma Quotations & Review'],
        'proformas.review' => ['label' => 'Review, Accept & Reject Quotations', 'group' => 'Proforma Quotations & Review'],
        'proformas.edit' => ['label' => 'Edit Proforma Items & Unit Prices', 'group' => 'Proforma Quotations & Review'],
        'proformas.delete' => ['label' => 'Delete Proforma Quotations', 'group' => 'Proforma Quotations & Review'],
        'proformas.compare' => ['label' => 'Side-by-Side Quotation Comparison Matrix', 'group' => 'Proforma Quotations & Review'],
        'proformas.export' => ['label' => 'Export Quotations & Reports (Excel / PDF)', 'group' => 'Proforma Quotations & Review'],

        'users.manage' => ['label' => 'Manage Users, Profiles & System Roles', 'group' => 'Users & Access Control'],

        'notifications.view' => ['label' => 'View System Notifications & Alerts', 'group' => 'Communications & Telegram'],
        'outbox.view' => ['label' => 'View Telegram Outbound Message Log', 'group' => 'Communications & Telegram'],

        'audit.view' => ['label' => 'View Append-Only Security Audit Trail', 'group' => 'System & Settings'],
        'settings.view' => ['label' => 'View Organization & System Settings', 'group' => 'System & Settings'],
        'settings.manage' => ['label' => 'Manage Telegram Bot & System Configuration', 'group' => 'System & Settings'],
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
