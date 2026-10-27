<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Backup extends Model
{
    protected $fillable = [

        'filename',

        'file_path',

        'file_size',

        'backup_type',

        'status',

        'created_by',

        'notes',
    ];

    protected $casts = [

        'file_size' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function getFileSizeMbAttribute()
    {
        return round($this->file_size / 1024 / 1024, 2);
    }
}