<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $fillable = ['name', 'city', 'description'];

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }
}
