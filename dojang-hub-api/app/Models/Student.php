<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'akademi_id',
        'current_rank_id',
        'primary_class_id',
        'member_number',
        'name',
        'gender',
        'birth_date',
        'joined_date',
        'status',
        'height_cm',
        'weight_kg',
        'student_phone',
        'guardian_name',
        'guardian_phone',
        'photo_url',
        'address',
        'shirt_size',
        'school_name',
        'school_grade',
        'health_notes',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'joined_date' => 'date',
            'height_cm' => 'integer',
            'weight_kg' => 'decimal:2',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function currentRank(): BelongsTo
    {
        return $this->belongsTo(SportRank::class, 'current_rank_id');
    }

    public function primaryClass(): BelongsTo
    {
        return $this->belongsTo(TrainingClass::class, 'primary_class_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(TrainingAttendance::class);
    }

    public function sppBills(): HasMany
    {
        return $this->hasMany(SppBill::class);
    }

    public function evaluationScores(): HasMany
    {
        return $this->hasMany(StudentEvaluationScore::class);
    }

    public function rankPromotionParticipants(): HasMany
    {
        return $this->hasMany(RankPromotionParticipant::class);
    }

    public function rankHistories(): HasMany
    {
        return $this->hasMany(StudentRankHistory::class);
    }
}
