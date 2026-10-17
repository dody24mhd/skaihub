<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEvaluationScore extends Model
{
    protected $fillable = [
        'akademi_id',
        'evaluation_period_id',
        'evaluation_aspect_id',
        'student_id',
        'class_id',
        'assessed_by',
        'score',
        'indicator',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(EvaluationPeriod::class, 'evaluation_period_id');
    }

    public function aspect(): BelongsTo
    {
        return $this->belongsTo(EvaluationAspect::class, 'evaluation_aspect_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(TrainingClass::class, 'class_id');
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessed_by');
    }
}
