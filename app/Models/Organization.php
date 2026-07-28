<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $fillable = [
        'name', 'tin', 'address', 'logo_path', 'currency', 'approval_threshold',
    ];

    protected $casts = [
        'approval_threshold' => 'decimal:2',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function proformaRequests(): HasMany
    {
        return $this->hasMany(ProformaRequest::class);
    }
}
