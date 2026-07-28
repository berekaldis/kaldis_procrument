<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $credentials['email'] = strtolower(trim($credentials['email']));

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return response()->json(['error' => 'Invalid email or password.'], 422);
        }

        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'Invalid email or password.'], 422);
        }

        if (! $user->active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['error' => 'This account has been deactivated. Please contact an administrator.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $request->session()->regenerate();

        $this->audit->log($user->name, 'user', (string) $user->id, 'login', 'User logged in');

        return response()->json([
            'ok' => true,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $this->audit->log($user->name, 'user', (string) $user->id, 'logout', 'User logged out');
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['user' => null], 200);
        }

        return response()->json(['user' => $this->userPayload($user)]);
    }

    private function userPayload($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'organizationId' => $user->organization_id,
            'active' => (bool) $user->active,
            'lastLoginAt' => $user->last_login_at?->toIso8601String(),
            'permissions' => $user->permissions(),
        ];
    }
}
