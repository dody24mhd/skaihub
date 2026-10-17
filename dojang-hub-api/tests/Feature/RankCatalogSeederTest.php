<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SportRank;
use App\Models\Student;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RankCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RankCatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_global_catalog_per_rank_system(): void
    {
        $this->seed(RankCatalogSeeder::class);

        $this->assertSame(23, $this->globalCount('taekwondo_kukkiwon'));
        $this->assertSame(20, $this->globalCount('karate_forki'));
        $this->assertSame(17, $this->globalCount('karate_kki'));

        $geup1 = SportRank::where('code', 'tkd-geup-1')->firstOrFail();
        $this->assertSame('taekwondo', $geup1->sport_type);
        $this->assertSame('geup', $geup1->level_type);
        $this->assertSame(1, $geup1->level_number);
        $this->assertSame(100, $geup1->sequence);
        $this->assertSame('red', $geup1->belt_color);
        $this->assertSame('black', $geup1->stripe_color);

        $poom1 = SportRank::where('code', 'tkd-poom-1')->firstOrFail();
        $dan1 = SportRank::where('code', 'tkd-dan-1')->firstOrFail();
        $this->assertSame($dan1->sequence, $poom1->sequence);

        $kkiFirst = SportRank::where('rank_system', 'karate_kki')->orderBy('sequence')->firstOrFail();
        $this->assertSame('kki-kyu-7', $kkiFirst->code);
        $this->assertSame('karate', $kkiFirst->sport_type);
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(RankCatalogSeeder::class);
        $ids = SportRank::orderBy('id')->pluck('id')->all();

        $this->seed(RankCatalogSeeder::class);

        $this->assertSame($ids, SportRank::orderBy('id')->pluck('id')->all());
        $this->assertSame(60, SportRank::count());
    }

    public function test_legacy_taekwondo_rows_are_remapped_without_breaking_student_fk(): void
    {
        $akademi = Akademi::create([
            'name' => 'Lama',
            'slug' => 'lama',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);
        $legacyWhite = SportRank::create(['sport_type' => 'taekwondo', 'code' => 'white', 'label' => 'Sabuk Putih', 'sequence' => 1]);
        $legacyBlack = SportRank::create(['sport_type' => 'taekwondo', 'code' => 'black', 'label' => 'Sabuk Hitam', 'sequence' => 7]);
        $student = $akademi->siswa()->create([
            'member_number' => 'L-1',
            'name' => 'Siswa Lama',
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2024-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
            'current_rank_id' => $legacyWhite->id,
        ]);

        $this->seed(RankCatalogSeeder::class);

        $this->assertDatabaseMissing('sport_ranks', ['code' => 'white']);
        $this->assertSame('tkd-geup-10', $legacyWhite->fresh()->code);
        $this->assertSame('tkd-dan-1', $legacyBlack->fresh()->code);
        $this->assertSame(1, SportRank::where('code', 'tkd-geup-10')->count());
        $this->assertSame($legacyWhite->id, $student->fresh()->current_rank_id);
        $this->assertSame(23, $this->globalCount('taekwondo_kukkiwon'));
    }

    public function test_database_seeder_seeds_catalog_and_demo_students_use_it(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(60, SportRank::whereNull('akademi_id')->count());

        $rankSystems = Student::with('currentRank')->get()
            ->pluck('currentRank.rank_system')
            ->unique()
            ->values()
            ->all();

        $this->assertSame(['taekwondo_kukkiwon'], $rankSystems);
    }

    private function globalCount(string $system): int
    {
        return SportRank::whereNull('akademi_id')->where('rank_system', $system)->count();
    }

    public function test_reseeding_repairs_mislabelled_rank_system_without_duplicates(): void
    {
        $this->seed(RankCatalogSeeder::class);
        $kkiId = SportRank::whereNull('akademi_id')->where('code', 'kki-kyu-7')->value('id');
        $count = SportRank::count();

        // After migrate:rollback + migrate, the column backfill labels every global karate row as FORKI.
        SportRank::whereNull('akademi_id')->where('sport_type', 'karate')->update(['rank_system' => 'karate_forki']);

        $this->seed(RankCatalogSeeder::class);

        $this->assertSame($count, SportRank::count());
        $this->assertSame('karate_kki', SportRank::find($kkiId)->rank_system);
    }
}
