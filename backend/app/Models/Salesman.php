<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Salesman extends Model
{
    protected $fillable = ['name', 'phone', 'commission_rate', 'status'];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'status' => 'boolean',
        ];
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
