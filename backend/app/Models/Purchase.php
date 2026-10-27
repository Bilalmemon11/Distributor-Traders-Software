<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    protected $fillable = [
        'po_no',
        'vendor_id',
        'date',
        'items_description',
        'total',
        'paid',
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total' => 'decimal:2',
            'paid' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }
    public function returns(): HasMany
{
    return $this->hasMany(PurchaseReturn::class);
}

}

