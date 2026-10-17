<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingClass extends Model
{
    use SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'akademi_id',
        'training_place_id',
        'name',
        'spp_amount_override',
        'target_sessions_per_month',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'spp_amount_override' => 'decimal:2',
            'target_sessions_per_month' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function trainingPlace(): BelongsTo
    {
        return $this->belongsTo(TrainingPlace::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'primary_class_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(TrainingSchedule::class, 'class_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class, 'class_id');
    }

    public function sppBills(): HasMany
    {
        return $this->hasMany(SppBill::class, 'class_id');
    }
}
