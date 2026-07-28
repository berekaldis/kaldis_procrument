<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelegramSession extends Model
{
    protected $primaryKey = 'chat_id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'chat_id', 'language', 'pending_action', 'pending_payload',
    ];

    protected $casts = [
        'pending_payload' => 'array',
    ];

    public static function forChat(string $chatId): self
    {
        return static::firstOrCreate(['chat_id' => $chatId]);
    }

    public function clearPending(): void
    {
        $this->update(['pending_action' => null, 'pending_payload' => null]);
    }
}
