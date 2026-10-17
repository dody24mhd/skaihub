<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentRankHistory extends Model
{
    protected $fillable = [
        'akademi_id',
        'student_id',
        'sport_rank_id',
        'achieved_on',
        'source_type',
        'rank_promotion_participant_id',
        'notes',
        'changed_by',
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

    public function sportRank(): BelongsTo
    {
        return $this->belongsTo(SportRank::class);
    }

    public function promotionParticipant(): BelongsTo
    {
        return $this->belongsTo(RankPromotionParticipant::class, 'rank_promotion_participant_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
