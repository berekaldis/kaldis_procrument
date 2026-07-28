<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = [
        'organization_id', 'legal_name', 'trade_name', 'trade_license_no',
        'tin', 'vat_no', 'category_tags', 'contact_name', 'contact_phone',
        'contact_email', 'telegram_chat_id', 'telegram_username', 'language',
        'payment_terms', 'bank_details', 'verification_status', 'notes', 'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SupplierDocument::class);
    }

    public function proformas(): HasMany
    {
        return $this->hasMany(Proforma::class);
    }

    public function requestSuppliers(): HasMany
    {
        return $this->hasMany(ProformaRequestSupplier::class);
    }

    public function telegramLinked(): bool
    {
        return ! empty($this->telegram_chat_id);
    }

    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (empty($term)) {
            return $q;
        }

        return $q->where(function (Builder $inner) use ($term) {
            $term = "%{$term}%";
            $inner->orWhere('legal_name', 'like', $term)
                ->orWhere('trade_name', 'like', $term)
                ->orWhere('tin', 'like', $term)
                ->orWhere('contact_name', 'like', $term)
                ->orWhere('contact_phone', 'like', $term)
                ->orWhere('contact_email', 'like', $term);
        });
    }
}
