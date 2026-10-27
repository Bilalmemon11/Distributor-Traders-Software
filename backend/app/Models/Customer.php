<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = ['name', 'phone', 'address', 'type', 'balance', 'total_purchase'];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'total_purchase' => 'decimal:2',
        ];
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
