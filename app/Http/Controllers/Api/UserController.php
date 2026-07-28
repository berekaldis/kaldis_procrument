<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $users = User::orderBy('id')->get();

        return response()->json($users->map(fn ($u) => $this->serialize($u)));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validated();
        $newUser = User::create([
            'organization_id' => $user->organization_id,
            'name' => $data['name'],
            'email' => strtolower(trim($data['email'])),
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
            'active' => $data['active'] ?? true,
        ]);

        $this->audit->log(
            $user->name,
            'user',
            (string) $newUser->id,
            'create',
            'Created user "'.$newUser->email.'" with role '.$newUser->role,
        );

        return response()->json(['ok' => true, 'user' => $this->serialize($newUser->fresh())], 201);
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $target = User::findOrFail($id);
        $actor = $request->user();
        $data = $request->validated();

        // Self-protection: cannot change own role / active
        if ($target->id === $actor->id) {
            if (array_key_exists('role', $data) && $data['role'] !== $target->role) {
                throw ValidationException::withMessages([
                    'role' => 'You cannot change your own role.',
                ]);
            }
            if (array_key_exists('active', $data) && $data['active'] === false) {
                throw ValidationException::withMessages([
                    'active' => 'You cannot deactivate your own account.',
                ]);
            }
            unset($data['role'], $data['active']);
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $changes = [];
        foreach (['name', 'phone', 'role', 'active'] as $f) {
            if (array_key_exists($f, $data) && $target->{$f} != $data[$f]) {
                $changes[] = "{$f}: {$target->{$f}} → {$data[$f]}";
            }
        }
        if (isset($data['password'])) {
            $changes[] = 'password reset';
        }

        $target->update($data);

        if ($changes) {
            $this->audit->log(
                $actor->name,
                'user',
                (string) $target->id,
                'update',
                'Updated user "'.$target->email.'": '.implode('; ', $changes),
            );
        }

        return response()->json(['ok' => true, 'user' => $this->serialize($target->fresh())]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        if ($actor->id === $id) {
            return response()->json(['error' => 'You cannot deactivate your own account.'], 422);
        }

        $target = User::findOrFail($id);
        $target->active = false;
        $target->save();

        $this->audit->log(
            $actor->name,
            'user',
            (string) $target->id,
            'deactivate',
            'Deactivated user "'.$target->email.'"',
        );

        return response()->json(['ok' => true]);
    }

    private function serialize(User $u): array
    {
        return [
            'id' => $u->id,
            'organizationId' => $u->organization_id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'role' => $u->role,
            'active' => (bool) $u->active,
            'lastLoginAt' => $u->last_login_at?->toIso8601String(),
            'createdAt' => $u->created_at?->toIso8601String(),
            'hasPassword' => ! empty($u->getRawOriginal('password')),
        ];
    }
}
