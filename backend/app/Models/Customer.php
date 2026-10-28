<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    protected $fillable = ['name', 'phone', 'address', 'area_id', 'type', 'balance', 'credit_limit', 'total_purchase'];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'credit_limit' => 'decimal:2',
            'total_purchase' => 'decimal:2',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(CustomerPayment::class);
    }
    public function saleReturns()
{
    return $this->hasMany(SaleReturn::class);
}
}
