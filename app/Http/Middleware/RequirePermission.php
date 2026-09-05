<?php

namespace App\Http\Middleware;

use App\Enums\Permission;
use App\Services\RoleService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    /**
     * @param  Request  $request
     * @param  Closure(Request): Response  $next
     * @param  string  $permission  Dotted permission string (e.g. 'suppliers.manage')
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $allowed = false;
        foreach ($permissions as $p) {
            foreach (explode(',', $p) as $perm) {
                if (RoleService::canDotted($user->role, trim($perm))) {
                    $allowed = true;
                    break 2;
                }
            }
        }

        if (! $allowed) {
            return response()->json([
                'error' => 'Forbidden — required permission missing.',
            ], 403);
        }

        return $next($request);
    }
}
