<?php

use App\Services\RoleService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // The demo "Simulate supplier response" tool (and its permission)
        // was removed ahead of production deployment — drop the now-orphan
        // role_permissions rows so the permissions matrix stays clean.
        DB::table('role_permissions')->where('permission', 'proformas_simulate')->delete();

        // RoleService caches the role->permission matrix forever, including
        // serialized Permission enum cases. A cache warmed before this
        // deploy still references the now-deleted PROFORMAS_SIMULATE case,
        // and unserializing it throws — flush it so it's rebuilt fresh.
        Cache::forget(RoleService::CACHE_KEY);
    }

    public function down(): void
    {
        // Intentionally irreversible — the permission no longer exists.
    }
};
