<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Services\RoleService;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'organization_id', 'name', 'email', 'phone', 'role',
        'password', 'last_login_at', 'active',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'active' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function roleEnum(): UserRole
    {
        return UserRole::tryFrom($this->role) ?? UserRole::PURCHASER;
    }

    public function permissions(): array
    {
        return array_map(
            fn ($p) => $p->value(),
            RoleService::permissions($this->role),
        );
    }

    public function canPermission(\App\Enums\Permission $permission): bool
    {
        return RoleService::can($this->role, $permission);
    }
}
