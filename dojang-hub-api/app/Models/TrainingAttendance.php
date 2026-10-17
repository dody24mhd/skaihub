<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingAttendance extends Model
{
    protected $fillable = [
        'training_session_id',
        'student_id',
        'participant_name',
        'is_extra_participant',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_extra_participant' => 'boolean',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TrainingSession::class, 'training_session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
