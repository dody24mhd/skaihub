<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentAchievement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'akademi_id',
        'student_id',
        'title',
        'event_name',
        'achieved_on',
        'result_label',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'achieved_on' => 'date',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
