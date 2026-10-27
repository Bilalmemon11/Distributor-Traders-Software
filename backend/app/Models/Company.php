<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [

        'company_name',
        'owner_name',

        'email',
        'phone',
        'whatsapp',

        'ntn',
        'strn',

        'address',

        'city',
        'country',

        'currency',

        'invoice_prefix',
        'purchase_prefix',
        'return_prefix',

        'tax_percent',
        'discount_percent',

        'footer_text',
        'terms',

        'logo',

    ];
}