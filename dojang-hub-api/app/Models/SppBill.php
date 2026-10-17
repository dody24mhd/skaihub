<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SppBill extends Model
{
    use SoftDeletes;

    public const OPEN_STATUSES = ['unpaid', 'partial'];

    protected $appends = ['is_overdue'];

    protected $fillable = [
        'akademi_id',
        'student_id',
        'class_id',
        'billing_year',
        'billing_month',
        'amount',
        'paid_amount',
        'due_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'billing_year' => 'integer',
            'billing_month' => 'integer',
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    protected function isOverdue(): Attribute
    {
        return Attribute::get(fn (): bool => in_array($this->status, self::OPEN_STATUSES, true)
            && $this->due_date !== null
            && $this->due_date->lt(today()));
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->whereIn('status', self::OPEN_STATUSES)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', today()->toDateString());
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(TrainingClass::class, 'class_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SppPayment::class);
    }
}
