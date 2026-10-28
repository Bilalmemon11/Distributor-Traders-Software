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
        'default_invoice_size',
        'show_previous_balance',
        'show_signatures',
        'show_customer_area',
        'low_stock_threshold',
        'expiry_alert_days',
        'allow_negative_stock',
    ];

    protected $casts = [
        'show_previous_balance' => 'boolean',
        'show_signatures' => 'boolean',
        'show_customer_area' => 'boolean',
        'allow_negative_stock' => 'boolean',
        'low_stock_threshold' => 'integer',
        'expiry_alert_days' => 'integer',
        'tax_percent' => 'float',
        'discount_percent' => 'float',
    ];
}