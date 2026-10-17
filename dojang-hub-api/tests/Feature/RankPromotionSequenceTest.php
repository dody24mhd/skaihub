<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\RankPromotionEvent;
use App\Models\SportRank;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RankCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RankPromotionSequenceTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private RankPromotionEvent $event;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RankCatalogSeeder::class);

        $this->akademi = Akademi::create([
            'name' => 'Garuda',
            'slug' => 'garuda',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        $this->event = RankPromotionEvent::create([
            'akademi_id' => $this->akademi->id,
            'name' => 'UKT Oktober',
            'event_date' => '2026-10-20',
            'status' => 'draft',
            'created_by' => $this->admin->id,
        ]);

        Sanctum::actingAs($this->admin);
    }

    public function test_next_rank_is_accepted(): void
    {
        $student = $this->student('tkd-geup-10');

        $this->addParticipant($student, 'tkd-geup-9')
            ->assertCreated()
            ->assertJsonPath('rank_promotion_participant.to_rank.code', 'tkd-geup-9');
    }

    public function test_target_rank_must_be_higher_than_current_rank(): void
    {
        $student = $this->student('tkd-geup-8');

        $this->addParticipant($student, 'tkd-geup-8')
            ->assertUnprocessable()
            ->assertJsonPath('errors.to_rank_id.0', 'Tingkatan tujuan harus lebih tinggi dari tingkatan siswa saat ini.');

        $this->addParticipant($student, 'tkd-geup-10')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to_rank_id']);
    }

    public function test_skipping_ranks_requires_allow_skip_and_notes(): void
    {
        $student = $this->student('tkd-geup-10');

        $this->addParticipant($student, 'tkd-geup-7')
            ->assertUnprocessable()
            ->assertJsonPath('errors.to_rank_id.0', 'Tingkatan tujuan melompati 2 tingkat. Aktifkan izin loncat tingkat dan isi catatan.');

        $this->addParticipant($student, 'tkd-geup-7', ['allow_skip' => true])
            ->assertUnprocessable()
            ->assertJsonPath('errors.notes.0', 'Catatan wajib diisi saat loncat tingkat.');

        $this->addParticipant($student, 'tkd-geup-7', ['allow_skip' => true, 'notes' => 'Prestasi kejurda'])
            ->assertCreated();
    }

    public function test_poom_and_dan_of_same_level_are_one_step_from_geup_1(): void
    {
        $student = $this->student('tkd-geup-1');

        $this->addParticipant($student, 'tkd-poom-1')->assertCreated();

        $other = $this->student('tkd-geup-1', 'S-2');
        $this->addParticipant($other, 'tkd-dan-1')->assertCreated();
    }

    public function test_custom_rank_between_catalog_ranks_counts_as_a_step(): void
    {
        SportRank::create([
            'akademi_id' => $this->akademi->id,
            'sport_type' => 'taekwondo',
            'code' => 'putih-strip',
            'label' => 'Putih Strip',
            'sequence' => 15,
        ]);
        $student = $this->student('tkd-geup-10');

        $this->addParticipant($student, 'tkd-geup-9')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to_rank_id']);

        $this->addParticipant($student, 'putih-strip')->assertCreated();
    }

    public function test_target_rank_from_other_rank_system_is_rejected(): void
    {
        $student = $this->student('tkd-geup-10');

        $this->addParticipant($student, 'forki-kyu-9')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to_rank_id']);
    }

    public function test_updating_target_rank_is_validated_against_from_rank(): void
    {
        $student = $this->student('tkd-geup-10');
        $participantId = $this->addParticipant($student, 'tkd-geup-9')
            ->assertCreated()
            ->json('rank_promotion_participant.id');

        $this->patchJson("/api/akademi/rank-promotions/{$this->event->id}/participants/{$participantId}", [
            'to_rank_id' => $this->rankId('tkd-geup-5'),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['to_rank_id']);

        $this->patchJson("/api/akademi/rank-promotions/{$this->event->id}/participants/{$participantId}", [
            'result' => 'passed',
        ])->assertOk();
    }

    public function test_target_rank_owned_by_other_academy_is_rejected(): void
    {
        $other = Akademi::create([
            'name' => 'Rajawali',
            'slug' => 'rajawali',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
        SportRank::create([
            'akademi_id' => $other->id,
            'sport_type' => 'taekwondo',
            'code' => 'rajawali-strip',
            'label' => 'Strip Rajawali',
            'sequence' => 15,
        ]);
        $student = $this->student('tkd-geup-10');

        $this->addParticipant($student, 'rajawali-strip')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to_rank_id']);
    }

    public function test_coach_cannot_register_participant(): void
    {
        $student = $this->student('tkd-geup-10');
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->addParticipant($student, 'tkd-geup-7', ['allow_skip' => true, 'notes' => 'x'])
            ->assertForbidden();
    }

    private function addParticipant(Student $student, string $toCode, array $extra = [])
    {
        return $this->postJson("/api/akademi/rank-promotions/{$this->event->id}/participants", [
            'student_id' => $student->id,
            'to_rank_id' => $this->rankId($toCode),
            ...$extra,
        ]);
    }

    private function rankId(string $code): int
    {
        return SportRank::where('code', $code)->valueOrFail('id');
    }

    private function student(string $rankCode, string $member = 'S-1'): Student
    {
        return $this->akademi->siswa()->create([
            'member_number' => $member,
            'name' => 'Siswa '.$member,
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2024-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
            'current_rank_id' => $this->rankId($rankCode),
        ]);
    }
}
