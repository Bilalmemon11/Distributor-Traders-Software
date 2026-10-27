<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransaction extends Model
{
protected $fillable = [

'product_id',

'variant_id',

'type',

'qty',

'stock_before',

'stock_after',

'notes'

];

protected function casts(): array
    {
        return [

            'qty'=>'decimal:2',

            'stock_before'=>'decimal:2',

            'stock_after'=>'decimal:2',

        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(
        ProductVariant::class,
        'variant_id'
        );
    }
}