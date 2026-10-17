<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SportRank;
use App\Models\User;
use Database\Seeders\RankCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SportRankSystemFilterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RankCatalogSeeder::class);
    }

    public function test_index_returns_only_catalog_of_academy_rank_system_in_sequence_order(): void
    {
        $forki = $this->akademi('forki-satu', 'karate', 'karate_forki');
        $kki = $this->akademi('kki-satu', 'karate', 'karate_kki');

        Sanctum::actingAs(User::factory()->akademiAdmin($forki->id)->create());
        $forkiRanks = $this->getJson('/api/akademi/sport-ranks')->assertOk()->json('data');

        $this->assertCount(20, $forkiRanks);
        $this->assertSame(['karate_forki'], collect($forkiRanks)->pluck('rank_system')->unique()->values()->all());
        $this->assertSame('forki-kyu-10', $forkiRanks[0]['code']);
        $this->assertSame('forki-dan-10', end($forkiRanks)['code']);

        Sanctum::actingAs(User::factory()->akademiAdmin($kki->id)->create());
        $kkiCodes = collect($this->getJson('/api/akademi/sport-ranks')->assertOk()->json('data'))->pluck('code');

        $this->assertCount(17, $kkiCodes);
        $this->assertSame('kki-kyu-7', $kkiCodes->first());
        $this->assertFalse($kkiCodes->contains('forki-kyu-10'));
        $this->assertFalse($kkiCodes->contains('tkd-geup-10'));
    }

    public function test_academy_can_add_custom_rank_in_its_own_system(): void
    {
        $kki = $this->akademi('kki-satu', 'karate', 'karate_kki');
        Sanctum::actingAs(User::factory()->akademiAdmin($kki->id)->create());

        $this->postJson('/api/akademi/sport-ranks', [
            'code' => 'kki-kyu-6-strip',
            'label' => 'Kyu 6 Strip Hijau',
            'sequence' => 55,
            'belt_color' => 'yellow',
            'stripe_color' => 'green',
        ])->assertCreated()
            ->assertJsonPath('sport_rank.rank_system', 'karate_kki')
            ->assertJsonPath('sport_rank.akademi_id', $kki->id)
            ->assertJsonPath('sport_rank.belt_color', 'yellow')
            ->assertJsonPath('sport_rank.stripe_color', 'green');

        $codes = collect($this->getJson('/api/akademi/sport-ranks')->json('data'))->pluck('code')->all();
        $this->assertSame('kki-kyu-6-strip', $codes[2]);
    }

    public function test_custom_rank_rejects_unknown_belt_color(): void
    {
        $kki = $this->akademi('kki-satu', 'karate', 'karate_kki');
        Sanctum::actingAs(User::factory()->akademiAdmin($kki->id)->create());

        $this->postJson('/api/akademi/sport-ranks', [
            'code' => 'x',
            'label' => 'X',
            'sequence' => 5,
            'belt_color' => 'rainbow',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['belt_color']);
    }

    public function test_custom_rank_of_other_academy_in_same_system_is_hidden(): void
    {
        $a = $this->akademi('kki-a', 'karate', 'karate_kki');
        $b = $this->akademi('kki-b', 'karate', 'karate_kki');
        SportRank::create([
            'akademi_id' => $b->id,
            'sport_type' => 'karate',
            'code' => 'b-only',
            'label' => 'Milik B',
            'sequence' => 45,
        ]);

        Sanctum::actingAs(User::factory()->akademiAdmin($a->id)->create());
        $codes = collect($this->getJson('/api/akademi/sport-ranks')->json('data'))->pluck('code');

        $this->assertFalse($codes->contains('b-only'));
    }

    public function test_cannot_modify_builtin_rank_of_other_system(): void
    {
        $kki = $this->akademi('kki-satu', 'karate', 'karate_kki');
        Sanctum::actingAs(User::factory()->akademiAdmin($kki->id)->create());
        $forkiRank = SportRank::where('code', 'forki-kyu-10')->firstOrFail();

        $this->putJson("/api/akademi/sport-ranks/{$forkiRank->id}", ['label' => 'Ubah'])
            ->assertNotFound();
    }

    public function test_student_rank_must_belong_to_academy_rank_system(): void
    {
        $kki = $this->akademi('kki-satu', 'karate', 'karate_kki');
        Sanctum::actingAs(User::factory()->akademiAdmin($kki->id)->create());
        $student = [
            'name' => 'Siswa KKI',
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2024-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
        ];

        $this->postJson('/api/akademi/students', [
            ...$student,
            'current_rank_id' => SportRank::where('code', 'forki-kyu-10')->value('id'),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['current_rank_id']);

        $this->postJson('/api/akademi/students', [
            ...$student,
            'current_rank_id' => SportRank::where('code', 'kki-kyu-7')->value('id'),
        ])->assertCreated();
    }

    private function akademi(string $slug, string $sportType, string $rankSystem): Akademi
    {
        $akademi = Akademi::create([
            'name' => ucfirst($slug),
            'slug' => $slug,
            'sport_type' => $sportType,
            'rank_system' => $rankSystem,
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $akademi->subscriptions()->create([
            'plan' => 'pro',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 150,
            'extra_student_blocks' => 0,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'amount' => 199000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now(),
        ]);

        return $akademi;
    }
}
