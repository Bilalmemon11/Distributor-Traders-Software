<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $fillable = [
    'product_id',
    'variant_name',
    'sku',
    'barcode',
    'cost_price',
    'price',
    'stock_qty',
    'reorder_level',
    'batch_no',
    'expiry_date',
    'mfg_date',
    'status',
];

    protected $casts = [
        'status' => 'boolean',
        'cost_price' => 'decimal:2',
        'price' => 'decimal:2',
        'stock_qty' => 'decimal:2',
        'reorder_level' => 'decimal:2',
        'expiry_date' => 'date',
        'mfg_date' => 'date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    public function saleReturnItems()
{
    return $this->hasMany(
        SaleReturnItem::class,
        'product_variant_id'
    );
}
}