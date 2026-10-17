<?php

namespace App\Services\Demo;

use App\Enums\RankSystem;
use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Menyalin satu akademi demo (Taekwondo) menjadi akademi demo Karate: semua baris milik
 * akademi disalin dengan id yang dipetakan ulang, tanggal identik, istilah diganti ke Karate,
 * tingkatan dipetakan ke FORKI, dan foto publik diganti foto karate.
 * Pemanggil wajib membungkus clone() dalam transaksi lalu memanggil copyAssets() setelah commit.
 */
class AcademyCloner
{
    public const HERO_PHOTOS = ['karate-latihan-kelas.webp', 'karate-latihan-tendangan.webp', 'karate-podium-kejurnas.webp'];

    public const GALLERY_PHOTOS = ['karate-family-gathering.webp', 'karate-latihan-kelas.webp', 'poster-kejurnas-karate-2026.webp', 'karate-latihan-tendangan.webp'];

    /** Kata kunci keterangan galeri => foto yang paling cocok. */
    private const GALLERY_KEYWORDS = [
        'karate-family-gathering.webp' => ['gathering', 'keluarga', 'orang tua'],
        'poster-kejurnas-karate-2026.webp' => ['championship', 'kejuaraan', 'kejurnas', 'kejurda', 'turnamen'],
        'karate-latihan-kelas.webp' => ['tempat latihan', 'latihan', 'kelas'],
        'karate-latihan-tendangan.webp' => ['tendangan', 'kumite', 'sparring'],
    ];

    /** Nama lama akademi demo yang masih muncul di beberapa teks seed. */
    private const LEGACY_SOURCE_NAMES = ['Garuda Sakti'];

    private const EMAIL_DOMAIN_SUFFIX = '.test';

    private const DEMO_PASSWORD = 'password';

    private int $sourceId;

    private int $targetId;

    private string $assetsDir;

    private KarateTextAdapter $text;

    private KarateRankMapper $ranks;

    /** @var array<string, array<int, int>> tabel => [id lama => id baru] */
    private array $ids = [];

    /** @var array<string, array{source: int, cloned: int}> */
    private array $counts = [];

    /** @var array<string, string> path disk => nama berkas aset */
    private array $pendingAssets = [];

    public function __construct(private readonly string $disk = 'public') {}

    public static function publicProfileDirectory(int $akademiId): string
    {
        return "akademi/{$akademiId}/public-profile";
    }

    /**
     * @return array<string, array{source: int, cloned: int}>
     */
    public function clone(object $source, string $slug, string $name, string $assetsDir): array
    {
        $this->assetsDir = rtrim($assetsDir, '/\\');
        $this->assertAssetsExist();
        $this->sourceId = (int) $source->id;
        $this->ranks = new KarateRankMapper($this->sourceId);
        $this->text = new KarateTextAdapter($this->academyNameMap($source->name, $name));

        $this->cloneAkademi($source, $slug, $name);
        $this->cloneUsers(Str::slug($name, ''));
        $this->cloneTrainingMasterData();
        $this->cloneStudents($slug);
        $this->cloneSchedules();
        $this->cloneSessions();
        $this->cloneSpp();
        $this->cloneEvaluations();
        $this->cloneRankPromotions();
        $this->cloneSubscriptions();
        $this->clonePublicProfile();

        return $this->counts;
    }

    public function targetId(): int
    {
        return $this->targetId;
    }

    /** Salin berkas foto karate ke disk publik. Panggil setelah transaksi commit. */
    public function copyAssets(): void
    {
        foreach ($this->pendingAssets as $path => $file) {
            Storage::disk($this->disk)->put($path, file_get_contents($this->assetsDir.DIRECTORY_SEPARATOR.$file));
        }
    }

    private function cloneAkademi(object $source, string $slug, string $name): void
    {
        $row = $this->withoutId($source);
        $row['name'] = $name;
        $row['slug'] = $slug;
        $row['sport_type'] = 'karate';
        $row['rank_system'] = RankSystem::KarateForki->value;
        $row['logo_url'] = null;

        $this->targetId = DB::table('akademi')->insertGetId($row);
        $this->counts['akademi'] = ['source' => 1, 'cloned' => 1];
    }

    private function cloneUsers(string $domain): void
    {
        $password = Hash::make(self::DEMO_PASSWORD);
        $perRole = [];
        $users = $this->sourceRows('users');

        $emails = $users->values()->map(function (object $user) use (&$perRole, $domain) {
            $perRole[$user->role] = ($perRole[$user->role] ?? 0) + 1;

            return $this->emailFor($user->role, $perRole[$user->role], $domain);
        });
        $taken = DB::table('users')->whereIn('email', $emails->all())->pluck('email');
        if ($taken->isNotEmpty()) {
            throw new RuntimeException('Email sudah dipakai akun lain: '.$taken->implode(', '));
        }

        $this->copy('users', $users, fn (array $row, object $user, int $index) => array_merge($row, [
            'name' => $this->text->text($row['name']),
            'email' => $emails[$index],
            'password' => $password,
            'remember_token' => null,
            'avatar_url' => null,
        ]));

        $this->copy('coach_profiles', $this->sourceRows('coach_profiles'), fn (array $row) => array_merge($row, [
            'user_id' => $this->id('users', $row['user_id']),
            'license_number' => $this->text->text($row['license_number']),
            'rank_label' => $this->text->text($row['rank_label']),
            'address' => $this->text->sportOnly($row['address']),
            'photo_url' => null,
        ]));
    }

    private function emailFor(string $role, int $nth, string $domain): string
    {
        $local = match ($role) {
            'ketua_akademi' => $nth === 1 ? 'ketua' : "ketua{$nth}",
            'admin_akademi' => $nth === 1 ? 'admin' : "admin{$nth}",
            'pelatih' => "pelatih{$nth}",
            default => Str::slug($role, '').$nth,
        };

        return "{$local}@{$domain}".self::EMAIL_DOMAIN_SUFFIX;
    }

    private function cloneTrainingMasterData(): void
    {
        $this->copy('training_places', $this->sourceRows('training_places'), fn (array $row) => array_merge($row, [
            'name' => $this->text->text($row['name']),
            'address' => $this->text->sportOnly($row['address']),
            'notes' => $this->text->text($row['notes']),
        ]));

        $this->copy('classes', $this->sourceRows('classes'), fn (array $row) => array_merge($row, [
            'training_place_id' => $this->id('training_places', $row['training_place_id']),
            'name' => $this->text->text($row['name']),
        ]));

        // Tingkatan milik tenant tidak disalin: semua tingkatan dipetakan ke katalog global FORKI.
        $this->counts['sport_ranks (milik akademi)'] = [
            'source' => DB::table('sport_ranks')->where('akademi_id', $this->sourceId)->count(),
            'cloned' => 0,
        ];
    }

    private function cloneStudents(string $slug): void
    {
        $prefix = Student::memberNumberPrefix($slug);

        $this->copy('students', $this->sourceRows('students'), fn (array $row, object $student, int $index) => array_merge($row, [
            'current_rank_id' => $this->ranks->map($row['current_rank_id']),
            'primary_class_id' => $this->id('classes', $row['primary_class_id']),
            'member_number' => Student::formatMemberNumber($prefix, $index + 1),
            'photo_url' => null,
            'address' => $this->text->sportOnly($row['address']),
            'health_notes' => $this->text->text($row['health_notes']),
        ]));

        $this->copy('student_achievements', $this->sourceRows('student_achievements'), fn (array $row) => array_merge($row, [
            'student_id' => $this->id('students', $row['student_id']),
            'title' => $this->text->text($row['title']),
            'event_name' => $this->text->text($row['event_name']),
            'result_label' => $this->text->text($row['result_label']),
            'notes' => $this->text->text($row['notes']),
        ]));
    }

    private function cloneSchedules(): void
    {
        $this->copy('training_schedules', $this->sourceRows('training_schedules'), fn (array $row) => array_merge($row, [
            'class_id' => $this->id('classes', $row['class_id']),
            'training_place_id' => $this->id('training_places', $row['training_place_id']),
            'coach_id' => $this->id('users', $row['coach_id']),
            'notes' => $this->text->text($row['notes']),
        ]));

        $this->copy('training_schedule_coaches',
            $this->rowsOfParents('training_schedule_coaches', 'training_schedule_id', array_keys($this->ids['training_schedules'])),
            fn (array $row) => array_merge($row, [
                'training_schedule_id' => $this->id('training_schedules', $row['training_schedule_id']),
                'coach_id' => $this->id('users', $row['coach_id']),
            ]));
    }

    private function cloneSessions(): void
    {
        $sessions = $this->sourceRows('training_sessions');

        $this->copy('training_sessions', $sessions, fn (array $row) => array_merge($row, [
            'training_schedule_id' => $this->id('training_schedules', $row['training_schedule_id']),
            'class_id' => $this->id('classes', $row['class_id']),
            'training_place_id' => $this->id('training_places', $row['training_place_id']),
            'coach_id' => $this->id('users', $row['coach_id']),
            'material' => $this->text->text($row['material']),
            'notes' => $this->text->text($row['notes']),
            'reschedule_reason' => $this->text->text($row['reschedule_reason'] ?? null),
            'cancel_reason' => $this->text->text($row['cancel_reason'] ?? null),
            // Foto dokumentasi sesi sumber adalah foto taekwondo; tidak disalin.
            'photo_urls' => $row['photo_urls'] === null ? null : '[]',
            'rescheduled_to_id' => null,
            'rescheduled_from_id' => null,
        ]));

        foreach ($sessions as $session) {
            if ($session->rescheduled_to_id === null && $session->rescheduled_from_id === null) {
                continue;
            }
            DB::table('training_sessions')->where('id', $this->id('training_sessions', $session->id))->update([
                'rescheduled_to_id' => $this->id('training_sessions', $session->rescheduled_to_id),
                'rescheduled_from_id' => $this->id('training_sessions', $session->rescheduled_from_id),
            ]);
        }

        $sessionIds = array_keys($this->ids['training_sessions']);
        $this->copy('training_session_coaches', $this->rowsOfParents('training_session_coaches', 'training_session_id', $sessionIds),
            fn (array $row) => array_merge($row, [
                'training_session_id' => $this->id('training_sessions', $row['training_session_id']),
                'coach_id' => $this->id('users', $row['coach_id']),
            ]));

        $this->copy('training_attendances', $this->rowsOfParents('training_attendances', 'training_session_id', $sessionIds),
            fn (array $row) => array_merge($row, [
                'training_session_id' => $this->id('training_sessions', $row['training_session_id']),
                'student_id' => $this->id('students', $row['student_id']),
                'notes' => $this->text->text($row['notes']),
            ]));
    }

    private function cloneSpp(): void
    {
        $this->copy('academy_spp_settings', $this->sourceRows('academy_spp_settings'), fn (array $row) => $row);

        $this->copy('spp_bills', $this->sourceRows('spp_bills'), fn (array $row) => array_merge($row, [
            'student_id' => $this->id('students', $row['student_id']),
            'class_id' => $this->id('classes', $row['class_id']),
            'notes' => $this->text->text($row['notes']),
        ]));

        // Nomor kuitansi unik per akademi (KW-YYYYMM-NNNN), jadi disalin apa adanya.
        $this->copy('spp_payments', $this->sourceRows('spp_payments'), fn (array $row) => array_merge($row, [
            'spp_bill_id' => $this->id('spp_bills', $row['spp_bill_id']),
            'created_by' => $this->id('users', $row['created_by']),
            'proof_url' => null,
            'notes' => $this->text->text($row['notes']),
        ]));

        $this->copy('spp_bill_events', $this->sourceRows('spp_bill_events'), fn (array $row) => array_merge($row, [
            'spp_bill_id' => $this->id('spp_bills', $row['spp_bill_id']),
            'user_id' => $this->id('users', $row['user_id']),
            'notes' => $this->text->text($row['notes']),
        ]));
    }

    private function cloneEvaluations(): void
    {
        $this->copy('evaluation_periods', $this->sourceRows('evaluation_periods'), fn (array $row) => array_merge($row, [
            'name' => $this->text->text($row['name']),
            'notes' => $this->text->text($row['notes']),
        ]));

        $this->copy('evaluation_aspects', $this->sourceRows('evaluation_aspects'), fn (array $row) => array_merge($row, [
            'evaluation_period_id' => $this->id('evaluation_periods', $row['evaluation_period_id']),
            'name' => $this->text->text($row['name']),
            'category' => $this->text->text($row['category']),
            'description' => $this->text->text($row['description']),
        ]));

        $this->copy('student_evaluation_scores', $this->sourceRows('student_evaluation_scores'), fn (array $row) => array_merge($row, [
            'evaluation_period_id' => $this->id('evaluation_periods', $row['evaluation_period_id']),
            'evaluation_aspect_id' => $this->id('evaluation_aspects', $row['evaluation_aspect_id']),
            'student_id' => $this->id('students', $row['student_id']),
            'class_id' => $this->id('classes', $row['class_id']),
            'assessed_by' => $this->id('users', $row['assessed_by']),
            'notes' => $this->text->text($row['notes']),
        ]));
    }

    private function cloneRankPromotions(): void
    {
        $this->copy('rank_promotion_events', $this->sourceRows('rank_promotion_events'), fn (array $row) => array_merge($row, [
            'name' => $this->text->text($row['name']),
            'notes' => $this->text->text($row['notes']),
            'created_by' => $this->id('users', $row['created_by']),
        ]));

        $this->copy('rank_promotion_participants', $this->sourceRows('rank_promotion_participants'), fn (array $row) => array_merge($row, [
            'rank_promotion_event_id' => $this->id('rank_promotion_events', $row['rank_promotion_event_id']),
            'student_id' => $this->id('students', $row['student_id']),
            'from_rank_id' => $this->ranks->map($row['from_rank_id']),
            'to_rank_id' => $this->ranks->map($row['to_rank_id']),
            'assessed_by' => $this->id('users', $row['assessed_by']),
            'notes' => $this->text->text($row['notes']),
        ]));

        $this->copy('student_rank_histories', $this->sourceRows('student_rank_histories'), fn (array $row) => array_merge($row, [
            'student_id' => $this->id('students', $row['student_id']),
            'sport_rank_id' => $this->ranks->map($row['sport_rank_id']),
            'rank_promotion_participant_id' => $this->id('rank_promotion_participants', $row['rank_promotion_participant_id']),
            'changed_by' => $this->id('users', $row['changed_by']),
            'notes' => $this->text->text($row['notes']),
        ]));
    }

    private function cloneSubscriptions(): void
    {
        $this->copy('subscriptions', $this->sourceRows('subscriptions'), fn (array $row) => array_merge($row, [
            'created_by' => $this->id('users', $row['created_by']),
            'notes' => $this->text->text($row['notes']),
        ]));
    }

    private function clonePublicProfile(): void
    {
        $this->copy('academy_public_profiles', $this->sourceRows('academy_public_profiles'), fn (array $row) => array_merge($row, [
            'about' => $this->text->text($row['about']),
            'vision' => $this->text->text($row['vision']),
            'mission' => $this->text->text($row['mission']),
            'public_schedule' => $this->text->text($row['public_schedule']),
            'cta_label' => $this->text->text($row['cta_label']),
        ]));

        $this->copy('academy_public_hero_images', $this->sourceRows('academy_public_hero_images'),
            fn (array $row, object $hero, int $index) => array_merge($row, [
                'image_url' => $this->assetUrl(self::HERO_PHOTOS, $index),
                'caption' => $this->text->text($row['caption']),
            ]));

        $galleryItems = $this->sourceRows('academy_gallery_items');
        $galleryPhotos = $this->galleryPhotosFor($galleryItems->pluck('caption')->all());
        $this->copy('academy_gallery_items', $galleryItems,
            fn (array $row, object $item, int $index) => array_merge($row, [
                'image_url' => $this->assetUrl([$galleryPhotos[$index]], 0),
                'caption' => $this->text->text($row['caption']),
            ]));

        $this->copy('academy_public_achievements', $this->sourceRows('academy_public_achievements'), fn (array $row) => array_merge($row, [
            'title' => $this->text->text($row['title']),
            'description' => $this->text->text($row['description']),
        ]));

        // Foto pengurus sumber adalah potret pribadi; dikosongkan.
        $this->copy('academy_public_officials', $this->sourceRows('academy_public_officials'), fn (array $row) => array_merge($row, [
            'name' => $this->text->text($row['name']),
            'position' => $this->text->text($row['position']),
            'description' => $this->text->text($row['description']),
            'photo_url' => null,
        ]));
    }

    /**
     * Pilih foto galeri yang cocok dengan keterangan (mis. "Gathering" -> foto keluarga);
     * sisanya diisi foto yang belum terpakai, lalu bergilir.
     *
     * @param  list<?string>  $captions
     * @return list<string>
     */
    private function galleryPhotosFor(array $captions): array
    {
        $chosen = array_map(function (?string $caption) {
            $caption = Str::lower((string) $caption);
            foreach (self::GALLERY_KEYWORDS as $file => $keywords) {
                if (Str::contains($caption, $keywords)) {
                    return $file;
                }
            }

            return null;
        }, $captions);

        $unused = array_values(array_diff(self::GALLERY_PHOTOS, array_filter($chosen)));
        $fallback = $unused === [] ? self::GALLERY_PHOTOS : $unused;
        $next = 0;

        return array_map(function (?string $file) use ($fallback, &$next) {
            return $file ?? $fallback[$next++ % count($fallback)];
        }, $chosen);
    }

    /**
     * @param  list<string>  $photos
     */
    private function assetUrl(array $photos, int $index): string
    {
        $file = $photos[$index % count($photos)];
        $path = self::publicProfileDirectory($this->targetId).'/'.$file;
        $this->pendingAssets[$path] = $file;

        return Storage::disk($this->disk)->url($path);
    }

    private function assertAssetsExist(): void
    {
        $missing = collect(array_unique([...self::HERO_PHOTOS, ...self::GALLERY_PHOTOS]))
            ->reject(fn (string $file) => is_file($this->assetsDir.DIRECTORY_SEPARATOR.$file));

        if ($missing->isNotEmpty()) {
            throw new RuntimeException("Foto karate tidak ditemukan di {$this->assetsDir}: ".$missing->implode(', '));
        }
    }

    /** @return array<string, string> */
    private function academyNameMap(string $sourceName, string $targetName): array
    {
        $shortName = trim((string) preg_replace('/^Akademi\s+/i', '', $sourceName));
        $names = [$sourceName => $targetName, $shortName => $targetName];

        foreach (self::LEGACY_SOURCE_NAMES as $legacy) {
            $names[$legacy] = $targetName;
        }

        return $names;
    }

    /** Semua baris milik akademi sumber, termasuk yang soft-deleted, urut id. */
    private function sourceRows(string $table): Collection
    {
        return DB::table($table)->where('akademi_id', $this->sourceId)->orderBy('id')->get();
    }

    /** @param  list<int>  $parentIds */
    private function rowsOfParents(string $table, string $column, array $parentIds): Collection
    {
        return DB::table($table)->whereIn($column, $parentIds)->orderBy('id')->get();
    }

    /**
     * @param  callable(array<string, mixed>, object, int): array<string, mixed>  $transform
     */
    private function copy(string $table, Collection $rows, callable $transform): void
    {
        $this->ids[$table] ??= [];
        $cloned = 0;

        foreach ($rows->values() as $index => $source) {
            $row = $this->withoutId($source);
            if (array_key_exists('akademi_id', $row)) {
                $row['akademi_id'] = $this->targetId;
            }

            $this->ids[$table][(int) $source->id] = DB::table($table)->insertGetId($transform($row, $source, $index));
            $cloned++;
        }

        $this->counts[$table] = ['source' => $rows->count(), 'cloned' => $cloned];
    }

    /** @return array<string, mixed> */
    private function withoutId(object $row): array
    {
        $data = (array) $row;
        unset($data['id']);

        return $data;
    }

    private function id(string $table, int|string|null $oldId): ?int
    {
        if ($oldId === null) {
            return null;
        }

        return $this->ids[$table][(int) $oldId]
            ?? throw new RuntimeException("Relasi {$table} #{$oldId} tidak ditemukan di akademi sumber.");
    }
}
