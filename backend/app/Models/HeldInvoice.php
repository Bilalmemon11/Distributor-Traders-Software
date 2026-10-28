<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeldInvoice extends Model
{
    protected $fillable = [
        'hold_name',
        'customer_id',
        'customer_name',
        'total',
        'items_count',
        'invoice_data',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'items_count' => 'integer',
            'invoice_data' => 'array',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
