<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramOutbox extends Model
{
    protected $table = 'telegram_outbox';

    protected $fillable = [
        'supplier_id', 'supplier_name', 'chat_id', 'message',
        'status', 'error', 'payload', 'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
