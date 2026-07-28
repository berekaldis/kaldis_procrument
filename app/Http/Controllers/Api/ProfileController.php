<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $user->update($data);
        $this->audit->log($user->name, 'user', (string) $user->id, 'profile_update', 'Updated own profile.');

        return response()->json(['ok' => true, 'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'organizationId' => $user->organization_id,
            'permissions' => $user->permissions(),
        ]]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:8'],
        ]);

        if (! Hash::check($data['currentPassword'], $user->password)) {
            return response()->json(['error' => 'Current password is incorrect.'], 422);
        }

        $user->forceFill(['password' => Hash::make($data['newPassword'])])->save();
        $this->audit->log($user->name, 'user', (string) $user->id, 'password_change', 'Changed own password.');

        return response()->json(['ok' => true]);
    }
}
