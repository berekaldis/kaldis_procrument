<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'role', 'title', 'message', 'type', 'read', 'link',
    ];

    protected $casts = [
        'read' => 'boolean',
    ];
}
