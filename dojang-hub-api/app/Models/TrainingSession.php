<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingSession extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'akademi_id',
        'training_schedule_id',
        'class_id',
        'training_place_id',
        'coach_id',
        'session_date',
        'source_schedule_date',
        'starts_at',
        'ends_at',
        'material',
        'notes',
        'photo_urls',
        'session_type',
        'status',
        'reschedule_reason',
        'cancel_reason',
        'rescheduled_to_id',
        'rescheduled_from_id',
    ];

    public const UNCOUNTED_STATUSES = ['rescheduled', 'cancelled'];

    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'source_schedule_date' => 'date',
            'photo_urls' => 'array',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(TrainingSchedule::class, 'training_schedule_id');
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(TrainingClass::class, 'class_id');
    }

    public function trainingPlace(): BelongsTo
    {
        return $this->belongsTo(TrainingPlace::class);
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function coaches(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'training_session_coaches', 'training_session_id', 'coach_id')
            ->with('coachProfile')
            ->withTimestamps();
    }

    public function rescheduledTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'rescheduled_to_id');
    }

    public function rescheduledFrom(): BelongsTo
    {
        return $this->belongsTo(self::class, 'rescheduled_from_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(TrainingAttendance::class);
    }
}
