<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RankPromotionParticipant extends Model
{
    protected $fillable = [
        'rank_promotion_event_id',
        'akademi_id',
        'student_id',
        'from_rank_id',
        'to_rank_id',
        'result',
        'score',
        'notes',
        'assessed_by',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(RankPromotionEvent::class, 'rank_promotion_event_id');
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function fromRank(): BelongsTo
    {
        return $this->belongsTo(SportRank::class, 'from_rank_id');
    }

    public function toRank(): BelongsTo
    {
        return $this->belongsTo(SportRank::class, 'to_rank_id');
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessed_by');
    }
}
