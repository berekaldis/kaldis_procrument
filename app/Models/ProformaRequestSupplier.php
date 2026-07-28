<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProformaRequestSupplier extends Model
{
    protected $fillable = [
        'request_id', 'supplier_id', 'status', 'notified_at',
    ];

    protected $casts = [
        'notified_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ProformaRequest::class, 'request_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
