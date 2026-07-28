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
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        if (! RoleService::canDotted($user->role, $permission)) {
            return response()->json([
                'error' => 'Forbidden — this action requires the '.$permission.' permission.',
            ], 403);
        }

        return $next($request);
    }
}
