<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryMan extends Model
{
    protected $table = 'delivery_men';

    protected $fillable = [
        'name',
        'phone',
        'vehicle_no',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
        ];
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
