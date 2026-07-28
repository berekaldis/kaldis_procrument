<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BotState extends Model
{
    public $timestamps = false;

    protected $table = 'bot_state';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'last_update_id', 'updated_at',
    ];

    protected $casts = [
        'last_update_id' => 'integer',
        'updated_at' => 'datetime',
    ];

    public static function singleton(): self
    {
        return self::firstOrCreate(
            ['id' => 'singleton'],
            ['last_update_id' => 0, 'updated_at' => now()],
        );
    }
}
