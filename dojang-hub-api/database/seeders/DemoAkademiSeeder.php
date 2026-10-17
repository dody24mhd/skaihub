<?php

namespace Database\Seeders;

use App\Enums\RankSystem;
use App\Models\AcademyGalleryItem;
use App\Models\AcademyPublicAchievement;
use App\Models\AcademyPublicHeroImage;
use App\Models\AcademyPublicOfficial;
use App\Models\AcademyPublicProfile;
use App\Models\Akademi;
use App\Models\CoachProfile;
use App\Models\EvaluationAspect;
use App\Models\EvaluationPeriod;
use App\Models\RankPromotionEvent;
use App\Models\RankPromotionParticipant;
use App\Models\SportRank;
use App\Models\SppBill;
use App\Models\SppPayment;
use App\Models\Student;
use App\Models\StudentEvaluationScore;
use App\Models\Subscription;
use App\Models\TrainingAttendance;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;

class DemoAkademiSeeder extends Seeder
{
    public function run(): void
    {
        $akademi = Akademi::updateOrCreate(
            ['slug' => 'garuda-sakti'],
            [
                'name' => 'Garuda Sakti Academy',
                'sport_type' => 'taekwondo',
                'rank_system' => RankSystem::TaekwondoKukkiwon->value,
                'status' => 'active',
                'plan' => 'pro',
                'plan_expires_at' => now()->addMonths(6),
            ],
        );

        Subscription::updateOrCreate(
            ['akademi_id' => $akademi->id, 'status' => 'active'],
            [
                'plan' => 'pro',
                'duration_type' => 'semester',
                'duration_months' => 6,
                'included_student_limit' => 150,
                'extra_student_blocks' => 0,
                'starts_at' => now()->startOfDay(),
                'ends_at' => now()->addMonths(6)->endOfDay(),
                'subtotal_amount' => 894000,
                'discount_amount' => 0,
                'amount' => 894000,
                'payment_status' => 'paid',
                'payment_method' => 'Seeder',
                'activated_at' => now(),
                'notes' => 'Data demo lengkap untuk pengujian operasional akademi.',
            ],
        );

        $ketua = $this->user($akademi->id, 'Ketua Garuda', 'ketua@garudasakti.test', 'ketua_akademi');
        $pengurus = $this->user($akademi->id, 'Pengurus Garuda', 'admin@garudasakti.test', 'admin_akademi');
        $coachA = $this->user($akademi->id, 'Coach Dimas', 'dimas@garudasakti.test', 'pelatih');
        $coachB = $this->user($akademi->id, 'Coach Hafidz', 'hafidz@garudasakti.test', 'pelatih');

        $this->coachProfile($akademi->id, $coachA, '081234567801', 'DAN 3', 'KUKKI-DMS-003', 'Jl. Anggrek No. 4, Palembang');
        $this->coachProfile($akademi->id, $coachB, '081234567802', 'DAN 2', 'KUKKI-HFZ-002', 'Jl. Kenanga No. 8, Palembang');

        $ranks = $this->seedRanks();

        $place = $akademi->trainingPlaces()->updateOrCreate(
            ['name' => 'SDN-01 Palembang'],
            [
                'address' => 'Jl. Merdeka No. 10, Palembang',
                'notes' => null,
                'is_active' => true,
            ],
        );

        $juniorClass = $akademi->trainingClasses()->updateOrCreate(
            ['name' => 'SDN-01 Palembang'],
            [
                'training_place_id' => $place->id,
                'spp_amount_override' => 150000,
                'target_sessions_per_month' => 4,
                'is_active' => true,
            ],
        );

        $prestasiClass = $akademi->trainingClasses()->updateOrCreate(
            ['name' => 'Kelas Prestasi'],
            [
                'training_place_id' => $place->id,
                'spp_amount_override' => 250000,
                'target_sessions_per_month' => 8,
                'is_active' => true,
            ],
        );

        $students = $this->seedStudents($akademi, $juniorClass->id, $prestasiClass->id, $ranks);
        [$juniorSchedule, $prestasiSchedule] = $this->seedSchedules($akademi->id, $place->id, $juniorClass->id, $prestasiClass->id, $coachA, $coachB);

        $this->seedSessionsAndAttendance($akademi->id, $place->id, $students, $juniorSchedule, $prestasiSchedule, $coachA, $coachB);
        $this->seedSpp($akademi->id, $students, $pengurus);
        $this->seedEvaluations($akademi->id, $students, $coachA);
        $this->seedRankPromotion($akademi->id, $students, $ranks, $ketua, $coachA);
        $this->seedPublicProfile($akademi->id);
    }

    private function user(int $akademiId, string $name, string $email, string $role): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            [
                'akademi_id' => $akademiId,
                'name' => $name,
                'password' => Hash::make('password'),
                'role' => $role,
                'is_active' => true,
            ],
        );
    }

    private function coachProfile(int $akademiId, User $coach, string $phone, string $rank, string $license, string $address): void
    {
        CoachProfile::updateOrCreate(
            ['user_id' => $coach->id],
            [
                'akademi_id' => $akademiId,
                'phone' => $phone,
                'rank_label' => $rank,
                'license_number' => $license,
                'joined_date' => now()->subYears(2)->toDateString(),
                'address' => $address,
                'status' => 'active',
                'show_on_public' => true,
            ],
        );
    }

    private function seedPublicProfile(int $akademiId): void
    {
        AcademyPublicProfile::updateOrCreate(
            ['akademi_id' => $akademiId],
            [
                'about' => 'Garuda Sakti Academy adalah akademi taekwondo yang membina siswa usia sekolah hingga atlet prestasi dengan latihan terstruktur, disiplin, dan suasana belajar yang positif.',
                'vision' => 'Menjadi akademi taekwondo yang melahirkan pribadi tangguh, disiplin, dan berprestasi.',
                'mission' => "Membina teknik dasar dan karakter siswa secara konsisten.\nMendampingi atlet menuju kompetisi dengan program latihan terukur.\nMembangun lingkungan latihan yang aman dan suportif.",
                'public_schedule' => "Kelas Junior: Selasa 16.00-17.30\nKelas Prestasi: Sabtu 08.00-10.00",
                'whatsapp' => '6281234567800',
                'cta_label' => 'Daftar Trial via WhatsApp',
                'is_published' => true,
                'primary_color' => '#031636',
                'button_color' => '#d32f2f',
                'background_color' => '#f8fafc',
                'text_color' => '#0f172a',
                'heading_font' => 'Montserrat',
                'body_font' => 'Inter',
                'button_radius' => 8,
            ],
        );

        collect([
            ['https://placehold.co/1400x900/031636/ffffff?text=Garuda+Sakti+Hero+1', 'Latihan disiplin dan teknik'],
            ['https://placehold.co/1400x900/d32f2f/ffffff?text=Garuda+Sakti+Hero+2', 'Mental juara sejak dini'],
            ['https://placehold.co/1400x900/0f172a/ffffff?text=Garuda+Sakti+Hero+3', 'Kelas prestasi'],
        ])->each(fn (array $item, int $index) => AcademyPublicHeroImage::updateOrCreate(
            ['akademi_id' => $akademiId, 'image_url' => $item[0]],
            ['caption' => $item[1], 'focal_x' => 50, 'focal_y' => 50, 'pan_x' => 0, 'pan_y' => 0, 'zoom' => 100, 'sort_order' => $index + 1, 'is_active' => true],
        ));

        collect([
            ['https://placehold.co/900x700/031636/ffffff?text=Garuda+Sakti+Latihan', 'Latihan teknik dasar'],
            ['https://placehold.co/900x700/d32f2f/ffffff?text=Garuda+Sakti+Prestasi', 'Persiapan kejuaraan'],
            ['https://placehold.co/900x700/f8fafc/031636?text=Garuda+Sakti+Dojang', 'Suasana dojang'],
        ])->each(fn (array $item, int $index) => AcademyGalleryItem::updateOrCreate(
            ['akademi_id' => $akademiId, 'image_url' => $item[0]],
            ['caption' => $item[1], 'show_on_about' => $index < 2, 'sort_order' => $index + 1],
        ));

        collect([
            ['Juara Umum Kejuaraan Kota 2026', 'Capaian tim Garuda Sakti pada kategori junior dan prestasi.', '2026-05-20'],
            ['Program Atlet Prestasi', 'Pembinaan rutin untuk siswa yang siap mengikuti kompetisi.', '2026-04-12'],
        ])->each(fn (array $item, int $index) => AcademyPublicAchievement::updateOrCreate(
            ['akademi_id' => $akademiId, 'title' => $item[0]],
            ['description' => $item[1], 'achieved_on' => $item[2], 'sort_order' => $index + 1],
        ));

        collect([
            ['Ketua Garuda', 'Ketua Akademi', null, 'Penanggung jawab utama kegiatan akademi.'],
            ['Pengurus Garuda', 'Bendahara', null, 'Mengelola administrasi dan keuangan kegiatan.'],
        ])->each(fn (array $item, int $index) => AcademyPublicOfficial::updateOrCreate(
            ['akademi_id' => $akademiId, 'name' => $item[0], 'position' => $item[1]],
            ['photo_url' => $item[2], 'description' => $item[3], 'sort_order' => $index + 1, 'is_active' => true],
        ));
    }

    /**
     * Sabuk demo diambil dari katalog Kukkiwon (RankCatalogSeeder).
     *
     * @return Collection<string, SportRank>
     */
    private function seedRanks(): Collection
    {
        $this->call(RankCatalogSeeder::class);

        return SportRank::query()
            ->whereNull('akademi_id')
            ->where('rank_system', RankSystem::TaekwondoKukkiwon->value)
            ->orderBy('sequence')
            ->get()
            ->keyBy('code');
    }

    /**
     * @return array<int, Student>
     */
    private function seedStudents(Akademi $akademi, int $juniorClassId, int $prestasiClassId, Collection $ranks): array
    {
        $rows = [
            ['GARUDA-0001', 'Budi Santoso', 'male', '2014-01-12', 145, 38, 'tkd-geup-10', $juniorClassId, '5', 'M'],
            ['GARUDA-0002', 'Sari Aulia', 'female', '2014-03-20', 140, 35, 'tkd-geup-10', $juniorClassId, '5', 'S'],
            ['GARUDA-0003', 'Andi Pratama', 'male', '2013-07-05', 150, 43, 'tkd-geup-9', $juniorClassId, '6', 'M'],
            ['GARUDA-0004', 'Nadia Putri', 'female', '2012-11-18', 152, 44, 'tkd-geup-9', $prestasiClassId, '6', 'M'],
            ['GARUDA-0005', 'Rafi Alfarizi', 'male', '2011-09-02', 158, 49, 'tkd-geup-7', $prestasiClassId, '7', 'L'],
            ['GARUDA-0006', 'Alya Ramadhani', 'female', '2013-12-24', 148, 41, 'tkd-geup-10', $juniorClassId, '5', 'S'],
            ['GARUDA-0007', 'Fahri Maulana', 'male', '2012-05-15', 156, 46, 'tkd-geup-5', $prestasiClassId, '7', 'L'],
            ['GARUDA-0008', 'Keisha Amanda', 'female', '2015-02-08', 136, 32, 'tkd-geup-10', $juniorClassId, '4', 'S'],
            ['GARUDA-0009', 'Rizky Saputra', 'male', '2011-06-30', 162, 52, 'tkd-geup-3', $prestasiClassId, '8', 'XL'],
            ['GARUDA-0010', 'Dewi Maharani', 'female', '2014-10-10', 142, 36, 'tkd-geup-9', $juniorClassId, '5', 'M'],
        ];

        return collect($rows)->map(function (array $row) use ($akademi, $ranks) {
            [$member, $name, $gender, $birthDate, $height, $weight, $rankCode, $classId, $grade, $shirtSize] = $row;

            return $akademi->siswa()->updateOrCreate(
                ['member_number' => $member],
                [
                    'primary_class_id' => $classId,
                    'current_rank_id' => $ranks[$rankCode]->id,
                    'name' => $name,
                    'gender' => $gender,
                    'birth_date' => $birthDate,
                    'joined_date' => now()->subMonths(rand(3, 18))->toDateString(),
                    'status' => 'active',
                    'height_cm' => $height,
                    'weight_kg' => $weight,
                    'student_phone' => null,
                    'guardian_name' => 'Wali '.strtok($name, ' '),
                    'guardian_phone' => '08120000'.substr($member, -4),
                    'photo_url' => null,
                    'address' => 'Palembang',
                    'shirt_size' => $shirtSize,
                    'school_name' => 'SDN-01 Palembang',
                    'school_grade' => $grade,
                    'health_notes' => null,
                ],
            );
        })->all();
    }

    /**
     * @return array{0: TrainingSchedule, 1: TrainingSchedule}
     */
    private function seedSchedules(int $akademiId, int $placeId, int $juniorClassId, int $prestasiClassId, User $coachA, User $coachB): array
    {
        $junior = TrainingSchedule::updateOrCreate(
            ['akademi_id' => $akademiId, 'class_id' => $juniorClassId, 'day_of_week' => 2, 'starts_at' => '16:00'],
            [
                'training_place_id' => $placeId,
                'coach_id' => $coachA->id,
                'ends_at' => '17:30',
                'is_active' => true,
                'notes' => 'Jadwal rutin kelas junior.',
            ],
        );
        $junior->coaches()->sync([$coachA->id]);

        $prestasi = TrainingSchedule::updateOrCreate(
            ['akademi_id' => $akademiId, 'class_id' => $prestasiClassId, 'day_of_week' => 6, 'starts_at' => '08:00'],
            [
                'training_place_id' => $placeId,
                'coach_id' => $coachA->id,
                'ends_at' => '10:00',
                'is_active' => true,
                'notes' => 'Jadwal rutin kelas prestasi.',
            ],
        );
        $prestasi->coaches()->sync([$coachA->id, $coachB->id]);

        return [$junior, $prestasi];
    }

    private function seedSessionsAndAttendance(int $akademiId, int $placeId, array $students, TrainingSchedule $juniorSchedule, TrainingSchedule $prestasiSchedule, User $coachA, User $coachB): void
    {
        $month = now()->startOfMonth();
        $juniorDates = $this->datesForIsoWeekday($month, 2, 4);
        $prestasiDates = $this->datesForIsoWeekday($month, 6, 4);

        foreach ($juniorDates as $index => $date) {
            $session = $this->session($akademiId, $juniorSchedule, $date, 'regular', 'draft', 'Kuda-kuda dasar, tendangan ap chagi, dan disiplin baris.');
            $session->coaches()->sync([$coachA->id]);
            $this->attendanceForClass($session, $students, $juniorSchedule->class_id, $index);
        }

        foreach ($prestasiDates as $index => $date) {
            $session = $this->session($akademiId, $prestasiSchedule, $date, 'regular', $index < 2 ? 'completed' : 'draft', 'Speed kick, sparring drill, dan conditioning.');
            $session->coaches()->sync([$coachA->id, $coachB->id]);
            $this->attendanceForClass($session, $students, $prestasiSchedule->class_id, $index + 1);
        }

        $replacementDate = $month->copy()->addDays(12);
        $replacement = TrainingSession::updateOrCreate(
            [
                'akademi_id' => $akademiId,
                'class_id' => $juniorSchedule->class_id,
                'session_date' => $replacementDate->toDateString(),
                'session_type' => 'replacement',
            ],
            [
                'training_schedule_id' => $juniorSchedule->id,
                'training_place_id' => $placeId,
                'coach_id' => $coachB->id,
                // Sesi pengganti tidak memakai tanggal sumber jadwal (unique index per jadwal+tanggal sumber).
                'source_schedule_date' => null,
                'starts_at' => '17:00',
                'ends_at' => '18:00',
                'material' => 'Sesi pengganti: review teknik dasar dan pola tendangan.',
                'notes' => 'Pengganti jadwal rutin yang batal karena kegiatan sekolah.',
                'photo_urls' => [],
                'status' => 'completed',
            ],
        );
        $replacement->coaches()->sync([$coachB->id]);
        $this->attendanceForClass($replacement, $students, $juniorSchedule->class_id, 2);

        $extraDate = $month->copy()->addDays(19);
        $extra = TrainingSession::updateOrCreate(
            [
                'akademi_id' => $akademiId,
                'class_id' => $prestasiSchedule->class_id,
                'session_date' => $extraDate->toDateString(),
                'session_type' => 'extra',
            ],
            [
                'training_schedule_id' => null,
                'training_place_id' => $placeId,
                'coach_id' => $coachA->id,
                'source_schedule_date' => null,
                'starts_at' => '15:00',
                'ends_at' => '17:00',
                'material' => 'Sesi tambahan persiapan kejuaraan: sparring dan simulasi pertandingan.',
                'notes' => 'Tambahan latihan untuk atlet prestasi.',
                'photo_urls' => [],
                'status' => 'draft',
            ],
        );
        $extra->coaches()->sync([$coachA->id, $coachB->id]);
        $this->attendanceForClass($extra, $students, $prestasiSchedule->class_id, 3);
    }

    private function session(int $akademiId, TrainingSchedule $schedule, Carbon $date, string $type, string $status, string $material): TrainingSession
    {
        return TrainingSession::updateOrCreate(
            [
                'akademi_id' => $akademiId,
                'training_schedule_id' => $schedule->id,
                'session_date' => $date->toDateString(),
                'session_type' => $type,
            ],
            [
                'class_id' => $schedule->class_id,
                'training_place_id' => $schedule->training_place_id,
                'coach_id' => $schedule->coach_id,
                // Wajib diisi: "Kelas Hari Ini" mencocokkan sesi ke slot jadwal lewat source_schedule_date.
                'source_schedule_date' => $date->toDateString(),
                'starts_at' => $schedule->starts_at,
                'ends_at' => $schedule->ends_at,
                'material' => $material,
                'notes' => 'Data absensi demo.',
                'photo_urls' => [],
                'status' => $status,
            ],
        );
    }

    private function attendanceForClass(TrainingSession $session, array $students, int $classId, int $variant): void
    {
        $classStudents = collect($students)->where('primary_class_id', $classId)->values();

        foreach ($classStudents as $index => $student) {
            $status = match (true) {
                ($index + $variant) % 7 === 0 => 'excused',
                ($index + $variant) % 5 === 0 => 'absent',
                default => 'present',
            };

            TrainingAttendance::updateOrCreate(
                ['training_session_id' => $session->id, 'student_id' => $student->id],
                [
                    'participant_name' => null,
                    'is_extra_participant' => false,
                    'status' => $status,
                    'notes' => $status === 'present' ? null : 'Catatan demo.',
                ],
            );
        }

        if ($session->session_type === 'extra') {
            TrainingAttendance::updateOrCreate(
                ['training_session_id' => $session->id, 'student_id' => null, 'participant_name' => 'Tamu Sparring'],
                [
                    'is_extra_participant' => true,
                    'status' => 'present',
                    'notes' => 'Peserta tambahan dari kelas lain.',
                ],
            );
        }
    }

    private function seedSpp(int $akademiId, array $students, User $creator): void
    {
        $now = now();

        foreach (array_values($students) as $index => $student) {
            $amount = (int) ($student->primaryClass?->spp_amount_override ?? 150000);
            $paidAmount = match ($index % 5) {
                0, 1, 2 => $amount,
                3 => (int) floor($amount / 2),
                default => 0,
            };
            $status = match (true) {
                $paidAmount >= $amount => 'paid',
                $paidAmount > 0 => 'partial',
                default => 'unpaid',
            };

            $bill = SppBill::updateOrCreate(
                [
                    'akademi_id' => $akademiId,
                    'student_id' => $student->id,
                    'billing_year' => (int) $now->year,
                    'billing_month' => (int) $now->month,
                ],
                [
                    'class_id' => $student->primary_class_id,
                    'amount' => $amount,
                    'paid_amount' => $paidAmount,
                    'due_date' => $now->copy()->day(10)->toDateString(),
                    'status' => $status,
                    'notes' => $status === 'unpaid' ? 'Belum ada pembayaran.' : 'Tagihan demo.',
                ],
            );

            if ($paidAmount > 0) {
                SppPayment::updateOrCreate(
                    ['spp_bill_id' => $bill->id, 'notes' => 'Pembayaran demo SPP'],
                    [
                        'akademi_id' => $akademiId,
                        'amount' => $paidAmount,
                        'paid_at' => $now->copy()->day(min(8 + $index, 25))->toDateString(),
                        'method' => $index % 2 === 0 ? 'transfer' : 'cash',
                        'proof_url' => null,
                        'created_by' => $creator->id,
                    ],
                );
            }
        }
    }

    private function seedEvaluations(int $akademiId, array $students, User $assessor): void
    {
        $period = EvaluationPeriod::updateOrCreate(
            ['akademi_id' => $akademiId, 'name' => 'Semester 1 2026'],
            [
                'starts_at' => now()->startOfYear()->toDateString(),
                'ends_at' => now()->startOfYear()->addMonths(5)->endOfMonth()->toDateString(),
                'status' => 'active',
                'notes' => 'Periode penilaian demo.',
            ],
        );

        $aspects = collect([
            ['Teknik Dasar', 'Teknik', 1],
            ['Kedisiplinan', 'Sikap', 2],
            ['Fisik', 'Fisik', 3],
            ['Mental Bertanding', 'Sikap', 4],
            ['Kehadiran', 'Administrasi', 5],
        ])->map(fn (array $row) => EvaluationAspect::updateOrCreate(
            ['akademi_id' => $akademiId, 'evaluation_period_id' => $period->id, 'name' => $row[0]],
            [
                'category' => $row[1],
                'sort_order' => $row[2],
                'is_active' => true,
                'description' => 'Aspek demo untuk format penilaian.',
            ],
        ));

        foreach (array_values($students) as $studentIndex => $student) {
            foreach ($aspects as $aspectIndex => $aspect) {
                $score = min(96, 72 + (($studentIndex * 3 + $aspectIndex * 4) % 24));

                StudentEvaluationScore::updateOrCreate(
                    [
                        'evaluation_period_id' => $period->id,
                        'evaluation_aspect_id' => $aspect->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'akademi_id' => $akademiId,
                        'class_id' => $student->primary_class_id,
                        'assessed_by' => $assessor->id,
                        'score' => $score,
                        'indicator' => $this->indicatorForScore($score),
                        'notes' => $aspectIndex === 0 ? 'Perkembangan stabil.' : null,
                    ],
                );
            }
        }
    }

    private function seedRankPromotion(int $akademiId, array $students, Collection $ranks, User $creator, User $assessor): void
    {
        $event = RankPromotionEvent::updateOrCreate(
            ['akademi_id' => $akademiId, 'name' => 'UKT Mei 2026'],
            [
                'event_date' => now()->startOfMonth()->addDays(20)->toDateString(),
                'status' => 'completed',
                'notes' => 'Event demo kenaikan tingkat.',
                'created_by' => $creator->id,
            ],
        );

        foreach (array_slice(array_values($students), 0, 6) as $index => $student) {
            $fromRank = $student->currentRank;
            $toRank = $ranks->first(fn (SportRank $rank) => $rank->sequence > ($fromRank?->sequence ?? 0));
            $result = $index === 5 ? 'failed' : 'passed';

            RankPromotionParticipant::updateOrCreate(
                ['rank_promotion_event_id' => $event->id, 'student_id' => $student->id],
                [
                    'akademi_id' => $akademiId,
                    'from_rank_id' => $fromRank?->id,
                    'to_rank_id' => $toRank->id,
                    'result' => $result,
                    'score' => $result === 'passed' ? 82 + $index : 68,
                    'notes' => $result === 'passed' ? 'Lulus UKT demo.' : 'Perlu penguatan teknik dasar.',
                    'assessed_by' => $assessor->id,
                ],
            );
        }
    }

    /**
     * @return array<int, Carbon>
     */
    private function datesForIsoWeekday(Carbon $month, int $isoWeekday, int $limit): array
    {
        $date = $month->copy()->startOfMonth();
        while ((int) $date->isoWeekday() !== $isoWeekday) {
            $date->addDay();
        }

        $dates = [];
        while ($date->month === $month->month && count($dates) < $limit) {
            $dates[] = $date->copy();
            $date->addWeek();
        }

        return $dates;
    }

    private function indicatorForScore(int $score): string
    {
        if ($score < 60) {
            return 'kurang';
        }

        if ($score < 75) {
            return 'cukup';
        }

        if ($score < 90) {
            return 'baik';
        }

        return 'sangat_baik';
    }
}
