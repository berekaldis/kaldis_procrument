<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proforma extends Model
{
    protected $fillable = [
        'request_id', 'supplier_id', 'reference_no', 'message',
        'file_path', 'file_name', 'file_type', 'telegram_message_id',
        'received_via', 'status', 'notes', 'received_at',
        'items', 'total_amount', 'currency',
    ];

    protected $casts = [
        'received_at' => 'datetime',
        'items' => 'array',
        'total_amount' => 'decimal:2',
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
