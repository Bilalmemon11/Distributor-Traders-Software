<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
protected $fillable = [

'invoice_id',

'product_id',

'product_variant_id',

'qty',

'unit_price',

'total',

'returned_qty',

'remaining_qty',

'batch_no',

'expiry_date'

];

protected function casts(): array
    {
        return [

            'qty' => 'decimal:2',

            'unit_price' => 'decimal:2',

            'total' => 'decimal:2',

        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

public function variant()
{
    return $this->belongsTo(
        ProductVariant::class,
        'product_variant_id'
    );
}
}