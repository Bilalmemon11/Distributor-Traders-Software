<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleReturn extends Model
{
protected $fillable = [
    'return_no',
    'invoice_id',
    'customer_id',
    'date',
    'reason',
    'total',
];
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(SaleReturnItem::class);
    }
    public function variant()
{
    return $this->belongsTo(
        ProductVariant::class,
        'product_variant_id'
    );
}
}