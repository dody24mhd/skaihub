<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SportRank;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AkademiRankSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->superAdmin()->create());
    }

    public function test_rank_columns_exist(): void
    {
        $this->assertTrue(Schema::hasColumn('akademi', 'rank_system'));
        $this->assertTrue(Schema::hasColumns('sport_ranks', [
            'rank_system', 'level_type', 'level_number', 'belt_color', 'stripe_color',
        ]));
    }

    public function test_rank_system_defaults_from_sport_type_when_omitted(): void
    {
        $this->postJson('/api/super-admin/akademi', $this->payload(['sport_type' => 'karate']))
            ->assertCreated()
            ->assertJsonPath('akademi.rank_system', 'karate_forki');

        $this->postJson('/api/super-admin/akademi', $this->payload([
            'slug' => 'tkd-baru',
            'ketua_email' => 'ketua2@example.test',
        ]))->assertCreated()
            ->assertJsonPath('akademi.rank_system', 'taekwondo_kukkiwon');
    }

    public function test_super_admin_can_choose_kki_rank_system(): void
    {
        $this->postJson('/api/super-admin/akademi', $this->payload([
            'sport_type' => 'karate',
            'rank_system' => 'karate_kki',
        ]))->assertCreated()
            ->assertJsonPath('akademi.rank_system', 'karate_kki');

        $this->assertDatabaseHas('akademi', ['slug' => 'akademi-baru', 'rank_system' => 'karate_kki']);
    }

    public function test_rank_system_must_be_known_and_match_sport_type(): void
    {
        $this->postJson('/api/super-admin/akademi', $this->payload(['rank_system' => 'judo_kodokan']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rank_system']);

        $this->postJson('/api/super-admin/akademi', $this->payload([
            'sport_type' => 'taekwondo',
            'rank_system' => 'karate_kki',
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['rank_system'])
            ->assertJsonPath('errors.rank_system.0', 'Sistem tingkatan tidak sesuai dengan cabang olahraga.');
    }

    public function test_rank_system_change_is_blocked_when_students_hold_a_rank(): void
    {
        $akademi = Akademi::create([
            'name' => 'Karate Satu',
            'slug' => 'karate-satu',
            'sport_type' => 'karate',
            'status' => 'active',
            'plan' => 'starter',
        ]);
        $rank = SportRank::create(['sport_type' => 'karate', 'code' => 'forki-kyu-10', 'label' => 'Kyu 10', 'sequence' => 10]);

        $this->putJson("/api/super-admin/akademi/{$akademi->id}", ['rank_system' => 'karate_kki'])
            ->assertOk()
            ->assertJsonPath('akademi.rank_system', 'karate_kki');

        $akademi->siswa()->create([
            'member_number' => 'K-1',
            'name' => 'Siswa Karate',
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2024-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
            'current_rank_id' => $rank->id,
        ]);

        $this->putJson("/api/super-admin/akademi/{$akademi->id}", ['rank_system' => 'karate_forki'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rank_system']);
    }

    public function test_sport_rank_rank_system_is_derived_when_not_given(): void
    {
        $taekwondo = SportRank::create(['sport_type' => 'taekwondo', 'code' => 'x-1', 'label' => 'X', 'sequence' => 1]);
        $karate = SportRank::create(['sport_type' => 'karate', 'code' => 'x-1', 'label' => 'X', 'sequence' => 1]);

        $kki = Akademi::create([
            'name' => 'KKI Satu',
            'slug' => 'kki-satu',
            'sport_type' => 'karate',
            'rank_system' => 'karate_kki',
            'status' => 'active',
            'plan' => 'starter',
        ]);
        $own = SportRank::create([
            'akademi_id' => $kki->id,
            'sport_type' => 'karate',
            'code' => 'strip',
            'label' => 'Strip',
            'sequence' => 45,
        ]);

        $this->assertSame('taekwondo_kukkiwon', $taekwondo->rank_system);
        $this->assertSame('karate_forki', $karate->rank_system);
        $this->assertSame('karate_kki', $own->rank_system);
    }

    public function test_sport_without_catalog_has_no_rank_system_and_sees_only_its_sport_ranks(): void
    {
        $this->postJson('/api/super-admin/akademi', $this->payload(['sport_type' => 'judo']))
            ->assertCreated()
            ->assertJsonPath('akademi.rank_system', null);

        $this->postJson('/api/super-admin/akademi', $this->payload([
            'slug' => 'judo-dua',
            'ketua_email' => 'ketua2@example.test',
            'sport_type' => 'judo',
            'rank_system' => 'taekwondo_kukkiwon',
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['rank_system']);

        SportRank::create(['sport_type' => 'judo', 'code' => 'judo-white', 'label' => 'Putih', 'sequence' => 1]);
        SportRank::create(['sport_type' => 'pencak_silat', 'code' => 'silat-1', 'label' => 'Dasar', 'sequence' => 1]);
        SportRank::create(['sport_type' => 'taekwondo', 'code' => 'tkd-geup-10', 'label' => 'Geup 10', 'sequence' => 10]);

        $judo = Akademi::where('slug', 'akademi-baru')->firstOrFail();
        $judo->subscriptions()->update(['status' => 'active', 'payment_status' => 'paid']);
        Sanctum::actingAs(User::factory()->akademiAdmin($judo->id)->create());

        $this->getJson('/api/akademi/sport-ranks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'judo-white');
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Akademi Baru',
            'slug' => 'akademi-baru',
            'sport_type' => 'taekwondo',
            'ketua_name' => 'Ketua Baru',
            'ketua_email' => 'ketua@example.test',
            'ketua_password' => 'password123',
        ], $overrides);
    }
}
