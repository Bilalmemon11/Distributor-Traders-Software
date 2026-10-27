<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PurchaseReturn;

class Vendor extends Model
{
    protected $fillable = ['name', 'phone', 'city', 'balance', 'total_purchase'];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'total_purchase' => 'decimal:2',
        ];
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function payments()
    {
        return $this->hasMany(VendorPayment::class);
    }
    public function purchaseReturns(): HasMany
{
    return $this->hasMany(PurchaseReturn::class);
}
}
