<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProformaRequest extends Model
{
    protected $fillable = [
        'organization_id', 'reference_no', 'title', 'description',
        'requested_by', 'deadline', 'status',
    ];

    protected $casts = [
        'deadline' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProformaRequestItem::class, 'request_id');
    }

    public function requestSuppliers(): HasMany
    {
        return $this->hasMany(ProformaRequestSupplier::class, 'request_id');
    }

    public function suppliers()
    {
        return $this->belongsToMany(
            Supplier::class,
            'proforma_request_suppliers',
            'request_id',
            'supplier_id',
        )->withPivot(['status', 'notified_at', 'id'])->withTimestamps();
    }

    public function proformas(): HasMany
    {
        return $this->hasMany(Proforma::class, 'request_id');
    }
}
