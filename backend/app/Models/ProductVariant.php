<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $fillable = [
    'product_id',
    'variant_name',
    'sku',
    'cost_price',
    'price',
    'stock_qty',
    'reorder_level',
    'status',
];

    protected $casts = [
        'status' => 'boolean',
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