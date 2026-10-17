<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SportRank extends Model
{
    protected $fillable = [
        'sport_type',
        'code',
        'label',
        'sequence',
    ];
}
