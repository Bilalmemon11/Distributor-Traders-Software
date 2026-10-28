<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Product extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'category_id',
        'brand',
        'unit_id',
        'cost_price',
        'price',
        'stock_qty',
        'reorder_level',
        'batch_no',
        'expiry_date',
        'mfg_date',
        'status',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'stock_qty' => 'decimal:2',
            'status' => 'boolean',
            'expiry_date' => 'date',
            'mfg_date' => 'date',
        ];
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function purchaseItems(): HasMany
    {
      return $this->hasMany(PurchaseItem::class);
    } 

    public function inventoryTransactions(): HasMany
    {
        return $this->hasMany(InventoryTransaction::class);
    }
    public function saleReturnItems()
{
    return $this->hasMany(SaleReturnItem::class);
}

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
    public function variants()
{
    return $this->hasMany(ProductVariant::class);
}
}
