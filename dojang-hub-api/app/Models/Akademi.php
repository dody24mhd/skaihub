<?php

namespace App\Models;

use App\Enums\RankSystem;
use App\Services\SubscriptionService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Akademi extends Model
{
    use SoftDeletes;

    protected $table = 'akademi';

    protected $fillable = [
        'name',
        'slug',
        'sport_type',
        'rank_system',
        'logo_url',
        'status',
        'plan',
        'plan_expires_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (Akademi $akademi) {
            $akademi->rank_system ??= RankSystem::defaultForSport($akademi->sport_type ?? 'taekwondo')?->value;
        });
    }

    protected function casts(): array
    {
        return [
            'plan_expires_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscriptions(): HasMany
    {
        return $this->subscriptions()->whereIn('status', ['trialing', 'active', 'past_due']);
    }

    public function pelatih(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'pelatih');
    }

    public function siswa(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function trainingPlaces(): HasMany
    {
        return $this->hasMany(TrainingPlace::class);
    }

    public function trainingClasses(): HasMany
    {
        return $this->hasMany(TrainingClass::class);
    }

    public function coachProfiles(): HasMany
    {
        return $this->hasMany(CoachProfile::class);
    }

    public function trainingSchedules(): HasMany
    {
        return $this->hasMany(TrainingSchedule::class);
    }

    public function trainingSessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }

    public function sppBills(): HasMany
    {
        return $this->hasMany(SppBill::class);
    }

    public function evaluationPeriods(): HasMany
    {
        return $this->hasMany(EvaluationPeriod::class);
    }

    public function evaluationAspects(): HasMany
    {
        return $this->hasMany(EvaluationAspect::class);
    }

    public function rankPromotionEvents(): HasMany
    {
        return $this->hasMany(RankPromotionEvent::class);
    }

    public function publicProfile(): HasOne
    {
        return $this->hasOne(AcademyPublicProfile::class);
    }

    public function galleryItems(): HasMany
    {
        return $this->hasMany(AcademyGalleryItem::class)->orderBy('sort_order');
    }

    public function publicHeroImages(): HasMany
    {
        return $this->hasMany(AcademyPublicHeroImage::class)->orderBy('sort_order');
    }

    public function publicAchievements(): HasMany
    {
        return $this->hasMany(AcademyPublicAchievement::class)->orderBy('sort_order');
    }

    public function publicOfficials(): HasMany
    {
        return $this->hasMany(AcademyPublicOfficial::class)->orderBy('sort_order');
    }

    public function hasPublicWebsite(): bool
    {
        $subscriptions = app(SubscriptionService::class);
        $activeSubscription = $subscriptions->activeForAkademi($this);

        return (bool) ($subscriptions->entitlements($activeSubscription)['has_public_website'] ?? false);
    }
}
