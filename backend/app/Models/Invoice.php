<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_no',
        'customer_id',
        'salesman_id',
        'delivery_man_id',
        'date',
        'subtotal',
        'discount',
        'total',
        'paid',
        'cash_paid',
        'online_paid',
        'online_method',
        'payment_notes',
        'balance',
        'commission_amount',
        'payment_type',
        'delivery_status',
        'delivery_date',
        'delivery_notes'
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid' => 'decimal:2',
            'cash_paid' => 'decimal:2',
            'online_paid' => 'decimal:2',
            'balance' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'delivery_date' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesman(): BelongsTo
    {
        return $this->belongsTo(Salesman::class);
    }

    public function deliveryMan(): BelongsTo
    {
        return $this->belongsTo(DeliveryMan::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
    public function saleReturns()
{
    return $this->hasMany(SaleReturn::class);
}
}
