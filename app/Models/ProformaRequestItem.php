<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProformaRequestItem extends Model
{
    protected $fillable = [
        'request_id', 'item_name', 'description', 'quantity', 'unit',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ProformaRequest::class, 'request_id');
    }
}
