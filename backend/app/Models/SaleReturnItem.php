<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturnItem extends Model
{
    protected $fillable = [

        'sale_return_id',

        'product_id',

        'product_variant_id',

        'qty',

        'unit_price',

        'total',

    ];

    protected $casts = [

        'qty' => 'decimal:2',

        'unit_price' => 'decimal:2',

        'total' => 'decimal:2',

    ];

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(
            ProductVariant::class,
            'product_variant_id'
        );
    }
}