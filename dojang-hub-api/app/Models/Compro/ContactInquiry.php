<?php

namespace App\Models\Compro;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactInquiry extends Model
{
    use HasFactory;

    protected $table = 'contact_inquiries';

    protected $fillable = [
        'akademi_name',
        'person_name',
        'phone',
        'city',
        'plan_interest',
        'message',
        'source_page',
        'is_followed_up',
    ];

    protected $casts = [
        'is_followed_up' => 'boolean',
    ];
}
