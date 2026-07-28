<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $table = 'audit_logs';

    protected $fillable = [
        'actor', 'entity', 'entity_id', 'action', 'details', 'timestamp',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];
}
