<?php

namespace Tests\Feature;

use App\Services\Demo\AcademyCloner;
use Database\Seeders\RankCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CloneKarateDemoTest extends TestCase
{
    use RefreshDatabase;

    private const TABLES = [
        'users', 'coach_profiles', 'training_places', 'classes', 'students', 'training_schedules',
        'training_sessions', 'spp_bills', 'spp_payments', 'spp_bill_events', 'academy_spp_settings',
        'evaluation_periods', 'evaluation_aspects', 'student_evaluation_scores', 'rank_promotion_events',
        'rank_promotion_participants', 'student_rank_histories', 'student_achievements', 'subscriptions',
        'academy_public_profiles', 'academy_public_hero_images', 'academy_gallery_items',
        'academy_public_achievements', 'academy_public_officials',
    ];

    private string $assetsDir;

    private int $sourceId;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->seed(RankCatalogSeeder::class);
        $this->assetsDir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'karate-assets-'.uniqid();
        mkdir($this->assetsDir);
        foreach (array_unique([...AcademyCloner::HERO_PHOTOS, ...AcademyCloner::GALLERY_PHOTOS]) as $file) {
            file_put_contents($this->assetsDir.DIRECTORY_SEPARATOR.$file, 'webp-'.$file);
        }

        $this->sourceId = $this->buildSource();
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->assetsDir.DIRECTORY_SEPARATOR.'*') ?: []);
        @rmdir($this->assetsDir);

        parent::tearDown();
    }

    public function test_clones_source_into_karate_academy_with_matching_counts(): void
    {
        $before = $this->snapshot($this->sourceId);

        $this->runClone()->assertSuccessful();

        $target = DB::table('akademi')->where('slug', 'karate-musi')->first();
        $this->assertNotNull($target);
        $this->assertSame('Karate Musi', $target->name);
        $this->assertSame('karate', $target->sport_type);
        $this->assertSame('karate_forki', $target->rank_system);
        $this->assertSame('pro', $target->plan);
        $this->assertNull($target->logo_url);

        foreach (self::TABLES as $table) {
            $this->assertSame($this->rowCount($table, $this->sourceId), $this->rowCount($table, $target->id), "Jumlah {$table} berbeda");
        }
        $this->assertSame(2, $this->pivotCount('training_session_coaches', 'training_session_id', 'training_sessions', $target->id));
        $this->assertSame(2, $this->pivotCount('training_attendances', 'training_session_id', 'training_sessions', $target->id));
        $this->assertSame(1, $this->pivotCount('training_schedule_coaches', 'training_schedule_id', 'training_schedules', $target->id));

        $this->assertSame($before, $this->snapshot($this->sourceId), 'Data sumber berubah');
    }

    public function test_remaps_ranks_users_texts_and_photos(): void
    {
        $this->runClone()->assertSuccessful();
        $targetId = (int) DB::table('akademi')->where('slug', 'karate-musi')->value('id');

        $student = DB::table('students')->where('akademi_id', $targetId)->orderBy('id')->first();
        $this->assertSame('forki-kyu-7', $this->rankCode($student->current_rank_id));
        $this->assertSame('KARATE-0001', $student->member_number);
        $this->assertSame('Budi Santoso', $student->name);
        $this->assertStringStartsWith('2014-01-01', (string) $student->birth_date);

        $participant = DB::table('rank_promotion_participants')->where('akademi_id', $targetId)->first();
        $this->assertSame('forki-kyu-10', $this->rankCode($participant->from_rank_id));
        $this->assertSame('forki-kyu-7', $this->rankCode($participant->to_rank_id));
        $history = DB::table('student_rank_histories')->where('akademi_id', $targetId)->first();
        $this->assertSame('forki-dan-1', $this->rankCode($history->sport_rank_id));
        $this->assertSame($participant->id, $history->rank_promotion_participant_id);

        $emails = DB::table('users')->where('akademi_id', $targetId)->orderBy('id')->pluck('email')->all();
        $this->assertSame(['ketua@karatemusi.test', 'admin@karatemusi.test', 'pelatih1@karatemusi.test', 'pelatih2@karatemusi.test'], $emails);
        $this->assertSame(DB::table('users')->count(), DB::table('users')->distinct()->count('email'));
        $ketua = DB::table('users')->where('email', 'ketua@karatemusi.test')->first();
        $this->assertTrue(Hash::check('password', $ketua->password));
        $this->assertSame('Ketua Garuda', $ketua->name);

        $this->assertSame('Kelas Kata Karate', DB::table('classes')->where('akademi_id', $targetId)->value('name'));
        $this->assertSame('Dojo Karate Musi', DB::table('training_places')->where('akademi_id', $targetId)->value('name'));
        $this->assertSame('Jl. Sriwijaya No. 1, Palembang', DB::table('training_places')->where('akademi_id', $targetId)->value('address'));
        $this->assertSame('Kumite dan kata dasar, mae geri', DB::table('training_sessions')->where('akademi_id', $targetId)->orderBy('id')->value('material'));
        $this->assertSame('Ujian Kyu FORKI', DB::table('rank_promotion_events')->where('akademi_id', $targetId)->value('name'));
        $this->assertSame('Karate Musi adalah akademi karate di Palembang bersama Sensei.', DB::table('academy_public_profiles')->where('akademi_id', $targetId)->value('about'));
        $gallery = DB::table('academy_gallery_items')->where('akademi_id', $targetId)->first();
        $this->assertSame('MOK Karate Championship', $gallery->caption);
        $this->assertStringEndsWith('/public-profile/poster-kejurnas-karate-2026.webp', $gallery->image_url);
        $this->assertSame('Capaian tim Karate Musi.', DB::table('academy_public_achievements')->where('akademi_id', $targetId)->value('description'));
        $this->assertSame('FORKI-001', DB::table('coach_profiles')->where('akademi_id', $targetId)->value('license_number'));

        $reschedule = DB::table('training_sessions')->where('akademi_id', $targetId)->whereNotNull('rescheduled_to_id')->first();
        $this->assertSame($targetId, (int) DB::table('training_sessions')->where('id', $reschedule->rescheduled_to_id)->value('akademi_id'));
        $this->assertTrue(DB::table('training_attendances')->where('is_extra_participant', true)
            ->whereIn('training_session_id', DB::table('training_sessions')->where('akademi_id', $targetId)->pluck('id'))->exists());

        $hero = DB::table('academy_public_hero_images')->where('akademi_id', $targetId)->orderBy('id')->get();
        $this->assertStringEndsWith("akademi/{$targetId}/public-profile/karate-latihan-kelas.webp", $hero[0]->image_url);
        $this->assertSame(26, (int) $hero[0]->pan_x);
        Storage::disk('public')->assertExists("akademi/{$targetId}/public-profile/karate-latihan-kelas.webp");
        $this->assertNull(DB::table('academy_public_officials')->where('akademi_id', $targetId)->value('photo_url'));
        $this->assertTrue((bool) DB::table('academy_public_profiles')->where('akademi_id', $targetId)->value('is_published'));
    }

    public function test_refuses_existing_target_without_fresh_and_replaces_with_fresh(): void
    {
        $this->runClone()->assertSuccessful();
        $firstId = (int) DB::table('akademi')->where('slug', 'karate-musi')->value('id');

        $this->runClone()->assertFailed();
        $this->assertSame(1, DB::table('akademi')->where('slug', 'karate-musi')->count());

        $before = $this->snapshot($this->sourceId);
        $this->runClone(['--fresh' => true])->assertSuccessful();

        $newId = (int) DB::table('akademi')->where('slug', 'karate-musi')->value('id');
        $this->assertNotSame($firstId, $newId);
        $this->assertSame(0, DB::table('akademi')->where('id', $firstId)->count());
        $this->assertSame(0, DB::table('students')->where('akademi_id', $firstId)->count());
        $this->assertSame(0, DB::table('users')->where('akademi_id', $firstId)->count());
        $this->assertSame(4, DB::table('users')->where('akademi_id', $newId)->count());
        Storage::disk('public')->assertMissing("akademi/{$firstId}");
        Storage::disk('public')->assertExists("akademi/{$newId}/public-profile/karate-latihan-kelas.webp");
        $this->assertSame($before, $this->snapshot($this->sourceId));
    }

    public function test_refuses_target_equal_to_source(): void
    {
        $this->runClone(['--slug' => 'sriwijaya', '--fresh' => true])->assertFailed();
        $this->assertSame(1, DB::table('akademi')->where('slug', 'sriwijaya')->count());
        $this->assertSame(2, DB::table('students')->where('akademi_id', $this->sourceId)->count());
    }

    private function runClone(array $options = [])
    {
        return $this->artisan('demo:clone-karate', array_merge(['--assets' => $this->assetsDir], $options));
    }

    private function rowCount(string $table, int $akademiId): int
    {
        return DB::table($table)->where('akademi_id', $akademiId)->count();
    }

    private function pivotCount(string $pivot, string $column, string $parent, int $akademiId): int
    {
        return DB::table($pivot)->whereIn($column, DB::table($parent)->where('akademi_id', $akademiId)->pluck('id'))->count();
    }

    /** @return array<string, string> */
    private function snapshot(int $akademiId): array
    {
        $snapshot = ['akademi' => (string) json_encode(DB::table('akademi')->find($akademiId))];
        foreach (self::TABLES as $table) {
            $snapshot[$table] = md5((string) json_encode(DB::table($table)->where('akademi_id', $akademiId)->orderBy('id')->get()));
        }

        return $snapshot;
    }

    private function rankCode(int|string|null $id): ?string
    {
        return DB::table('sport_ranks')->where('id', $id)->value('code');
    }

    private function rankId(string $code): int
    {
        return (int) DB::table('sport_ranks')->whereNull('akademi_id')->where('code', $code)->value('id');
    }

    private function buildSource(): int
    {
        $ts = ['created_at' => '2026-05-31 04:08:23', 'updated_at' => '2026-05-31 04:08:23'];
        $id = DB::table('akademi')->insertGetId([
            'name' => 'Akademi Sriwijaya', 'slug' => 'sriwijaya', 'sport_type' => 'taekwondo',
            'rank_system' => 'taekwondo_kukkiwon', 'logo_url' => 'http://localhost/storage/logo.jpg',
            'status' => 'active', 'plan' => 'pro', 'plan_expires_at' => now()->addMonths(3), ...$ts,
        ]);
        $user = fn (string $name, string $email, string $role) => DB::table('users')->insertGetId([
            'akademi_id' => $id, 'name' => $name, 'email' => $email, 'role' => $role,
            'password' => Hash::make('secret'), 'is_active' => true, ...$ts,
        ]);
        $ketua = $user('Ketua Garuda', 'ketua@garudasakti.test', 'ketua_akademi');
        $admin = $user('Pengurus Garuda', 'admin@garudasakti.test', 'admin_akademi');
        $coach1 = $user('Coach Dimas', 'dimas@garudasakti.test', 'pelatih');
        $coach2 = $user('Coach Hafidz', 'hafidz@garudasakti.test', 'pelatih');
        DB::table('coach_profiles')->insert(['user_id' => $coach1, 'akademi_id' => $id, 'license_number' => 'KUKKI-001',
            'rank_label' => 'DAN 3', 'photo_url' => 'http://localhost/storage/coach.jpg', 'show_on_public' => true, 'status' => 'active', ...$ts]);

        $place = DB::table('training_places')->insertGetId(['akademi_id' => $id, 'name' => 'Dojang Sriwijaya',
            'address' => 'Jl. Sriwijaya No. 1, Palembang', 'is_active' => true, ...$ts]);
        $class = DB::table('classes')->insertGetId(['akademi_id' => $id, 'training_place_id' => $place,
            'name' => 'Kelas Poomsae Taekwondo', 'target_sessions_per_month' => 4, 'is_active' => true, ...$ts]);
        $student = fn (string $name, string $rank, string $number) => DB::table('students')->insertGetId([
            'akademi_id' => $id, 'current_rank_id' => $this->rankId($rank), 'primary_class_id' => $class,
            'member_number' => $number, 'name' => $name, 'gender' => 'male', 'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-10', 'status' => 'active', 'photo_url' => 'http://localhost/storage/s.jpg', ...$ts,
        ]);
        $budi = $student('Budi Santoso', 'tkd-geup-7', 'GARUDA-0001');
        $sari = $student('Sari Aulia', 'tkd-poom-1', 'GARUDA-0002');

        $schedule = DB::table('training_schedules')->insertGetId(['akademi_id' => $id, 'class_id' => $class,
            'training_place_id' => $place, 'coach_id' => $coach1, 'day_of_week' => 2, 'starts_at' => '16:00:00',
            'ends_at' => '17:30:00', 'is_active' => true, ...$ts]);
        DB::table('training_schedule_coaches')->insert(['training_schedule_id' => $schedule, 'coach_id' => $coach2, ...$ts]);
        $session = fn (string $date, string $status) => DB::table('training_sessions')->insertGetId([
            'akademi_id' => $id, 'training_schedule_id' => $schedule, 'class_id' => $class, 'training_place_id' => $place,
            'coach_id' => $coach1, 'session_date' => $date, 'source_schedule_date' => $date, 'starts_at' => '16:00:00',
            'ends_at' => '17:30:00', 'material' => 'Kyorugi dan poomsae dasar, ap chagi', 'photo_urls' => '[]',
            'session_type' => 'regular', 'status' => $status, ...$ts,
        ]);
        $s1 = $session('2026-05-05', 'rescheduled');
        $s2 = $session('2026-05-07', 'completed');
        DB::table('training_sessions')->where('id', $s1)->update(['rescheduled_to_id' => $s2]);
        DB::table('training_sessions')->where('id', $s2)->update(['rescheduled_from_id' => $s1]);
        DB::table('training_session_coaches')->insert([
            ['training_session_id' => $s2, 'coach_id' => $coach1, ...$ts],
            ['training_session_id' => $s2, 'coach_id' => $coach2, ...$ts],
        ]);
        DB::table('training_attendances')->insert([
            ['training_session_id' => $s2, 'student_id' => $budi, 'participant_name' => null, 'is_extra_participant' => false, 'status' => 'present', ...$ts],
            ['training_session_id' => $s2, 'student_id' => null, 'participant_name' => 'Tamu Trial', 'is_extra_participant' => true, 'status' => 'present', ...$ts],
        ]);

        DB::table('academy_spp_settings')->insert(['akademi_id' => $id, 'default_monthly_amount' => 150000, 'due_day' => 10, ...$ts]);
        $bill = DB::table('spp_bills')->insertGetId(['akademi_id' => $id, 'student_id' => $budi, 'class_id' => $class,
            'billing_year' => 2026, 'billing_month' => 5, 'amount' => 150000, 'paid_amount' => 150000, 'status' => 'paid', ...$ts]);
        DB::table('spp_payments')->insert(['akademi_id' => $id, 'spp_bill_id' => $bill, 'receipt_number' => 'KW-202605-0001',
            'amount' => 150000, 'paid_at' => '2026-05-08', 'method' => 'cash', 'created_by' => $admin, ...$ts]);
        DB::table('spp_bill_events')->insert(['akademi_id' => $id, 'spp_bill_id' => $bill, 'type' => 'payment', 'amount' => 150000, 'user_id' => $admin, ...$ts]);

        $period = DB::table('evaluation_periods')->insertGetId(['akademi_id' => $id, 'name' => 'Semester 1 2026',
            'starts_at' => '2026-01-01', 'ends_at' => '2026-06-30', 'status' => 'active', ...$ts]);
        $aspect = DB::table('evaluation_aspects')->insertGetId(['akademi_id' => $id, 'evaluation_period_id' => $period,
            'name' => 'Teknik Poomsae', 'category' => 'Teknik', 'sort_order' => 1, 'is_active' => true, ...$ts]);
        DB::table('student_evaluation_scores')->insert(['akademi_id' => $id, 'evaluation_period_id' => $period,
            'evaluation_aspect_id' => $aspect, 'student_id' => $budi, 'class_id' => $class, 'assessed_by' => $coach1,
            'score' => 85, 'indicator' => 'baik', ...$ts]);

        $event = DB::table('rank_promotion_events')->insertGetId(['akademi_id' => $id, 'name' => 'Ujian Geup Kukkiwon',
            'event_date' => '2026-06-21', 'status' => 'completed', 'created_by' => $ketua, ...$ts]);
        $participant = DB::table('rank_promotion_participants')->insertGetId(['rank_promotion_event_id' => $event,
            'akademi_id' => $id, 'student_id' => $budi, 'from_rank_id' => $this->rankId('tkd-geup-10'),
            'to_rank_id' => $this->rankId('tkd-geup-7'), 'result' => 'passed', 'assessed_by' => $coach1, ...$ts]);
        DB::table('student_rank_histories')->insert(['akademi_id' => $id, 'student_id' => $sari,
            'sport_rank_id' => $this->rankId('tkd-dan-1'), 'achieved_on' => '2026-06-21', 'source_type' => 'promotion',
            'rank_promotion_participant_id' => $participant, 'changed_by' => $ketua, ...$ts]);
        DB::table('student_achievements')->insert(['akademi_id' => $id, 'student_id' => $budi,
            'title' => 'Juara 1 Kyorugi', 'event_name' => 'Kejurkot Taekwondo', 'achieved_on' => '2026-05-20', ...$ts]);

        DB::table('subscriptions')->insert(['akademi_id' => $id, 'plan' => 'pro', 'duration_type' => 'semester',
            'duration_months' => 6, 'included_student_limit' => 150, 'starts_at' => now()->subMonths(3),
            'ends_at' => now()->addMonths(3), 'amount' => 894000, 'payment_status' => 'paid', 'status' => 'active', ...$ts]);

        DB::table('academy_public_profiles')->insert(['akademi_id' => $id, 'is_published' => true,
            'about' => 'Akademi Sriwijaya adalah akademi taekwondo di Palembang bersama Sabeum.', ...$ts]);
        foreach ([26, 13, 33] as $i => $pan) {
            DB::table('academy_public_hero_images')->insert(['akademi_id' => $id, 'image_url' => "http://localhost/storage/h{$i}.jpg",
                'sort_order' => $i, 'is_active' => true, 'focal_x' => 50, 'focal_y' => 50, 'pan_x' => $pan, 'pan_y' => 1, 'zoom' => 100, ...$ts]);
        }
        DB::table('academy_gallery_items')->insert(['akademi_id' => $id, 'image_url' => 'http://localhost/storage/g.jpg',
            'caption' => 'MOK Taekwondo Championship', 'sort_order' => 0, ...$ts]);
        DB::table('academy_public_achievements')->insert(['akademi_id' => $id, 'title' => 'Juara Umum',
            'description' => 'Capaian tim Garuda Sakti.', 'achieved_on' => '2026-05-20', 'sort_order' => 1, ...$ts]);
        DB::table('academy_public_officials')->insert(['akademi_id' => $id, 'name' => 'Ketua Garuda',
            'position' => 'Ketua Akademi', 'photo_url' => 'http://localhost/storage/o.png', 'sort_order' => 1, 'is_active' => true, ...$ts]);

        return $id;
    }
}
