<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuperAdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    private SubscriptionService $subscriptions;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 1)->setTime(9, 0));
        $this->subscriptions = app(SubscriptionService::class);
    }

    private function akademi(string $slug, string $status = 'active'): Akademi
    {
        return Akademi::create([
            'name' => 'Akademi '.$slug,
            'slug' => $slug,
            'sport_type' => 'taekwondo',
            'status' => $status,
            'plan' => 'starter',
        ]);
    }

    private function addActiveStudents(Akademi $akademi, int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            $akademi->siswa()->create([
                'member_number' => $akademi->slug.'-'.$i,
                'name' => 'Siswa '.$i,
                'gender' => 'male',
                'birth_date' => '2014-01-01',
                'joined_date' => '2026-01-01',
                'height_cm' => 150,
                'weight_kg' => 45,
                'status' => 'active',
            ]);
        }
    }

    private function arrangeAkademis(): void
    {
        $this->subscriptions->createInitial($this->akademi('aktif'), [
            'plan' => 'pro',
            'duration_type' => 'quarterly',
        ]);

        $this->subscriptions->createInitial($this->akademi('segera'), [
            'plan' => 'starter',
            'duration_type' => 'custom',
            'starts_at' => '2026-09-20',
            'ends_at' => '2026-10-10',
            'amount' => 99000,
            'notes' => 'Masa uji coba berbayar.',
        ]);

        $this->subscriptions->createInitial($this->akademi('tenggang'), [
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'starts_at' => '2026-08-29',
        ]);

        $this->subscriptions->createInitial($this->akademi('baca-saja'), [
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'starts_at' => '2026-08-01',
        ]);

        $penuh = $this->akademi('penuh');
        $this->subscriptions->createInitial($penuh, [
            'plan' => 'starter',
            'duration_type' => 'yearly',
        ]);
        $this->addActiveStudents($penuh, 80);

        $this->akademi('nonaktif', 'suspended');
    }

    public function test_dashboard_reports_mrr_states_attention_and_quota(): void
    {
        $this->arrangeAkademis();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $response = $this->getJson('/api/super-admin/dashboard')->assertOk();

        // aktif 597000/3 + segera 99000/1 + penuh 1188000/12
        $response
            ->assertJsonPath('mrr', 397000)
            ->assertJsonPath('state_counts.active', 2)
            ->assertJsonPath('state_counts.expiring', 1)
            ->assertJsonPath('state_counts.grace', 1)
            ->assertJsonPath('state_counts.read_only', 1)
            ->assertJsonCount(3, 'attention')
            ->assertJsonPath('attention.0.akademi_slug', 'baca-saja')
            ->assertJsonPath('attention.0.state', 'read_only')
            ->assertJsonPath('attention.1.akademi_slug', 'tenggang')
            ->assertJsonPath('attention.2.akademi_slug', 'segera')
            ->assertJsonPath('attention.2.days_left', 9)
            ->assertJsonCount(1, 'near_quota')
            ->assertJsonPath('near_quota.0.akademi_slug', 'penuh')
            ->assertJsonPath('near_quota.0.active_students', 80)
            ->assertJsonPath('near_quota.0.student_limit', 100)
            ->assertJsonPath('near_quota.0.usage_percent', 80);
    }

    public function test_dashboard_is_only_for_super_admin(): void
    {
        $akademi = $this->akademi('aktif');
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->getJson('/api/super-admin/dashboard')->assertForbidden();
    }

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/super-admin/dashboard')->assertUnauthorized();
    }
}
