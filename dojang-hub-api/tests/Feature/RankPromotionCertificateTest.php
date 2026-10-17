<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\RankPromotionEvent;
use App\Models\RankPromotionParticipant;
use App\Models\SportRank;
use App\Models\User;
use Database\Seeders\RankCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class RankPromotionCertificateTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

    private Akademi $akademi;

    private User $ketua;

    private RankPromotionEvent $event;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RankCatalogSeeder::class);
        $this->akademi = $this->makeAkademi('Akademi Garuda');
        $this->ketua = User::factory()->ketuaAkademi($this->akademi->id)->create(['name' => 'Sabeum Budi']);
        $this->event = RankPromotionEvent::create([
            'akademi_id' => $this->akademi->id,
            'name' => 'UKT Oktober 2026',
            'event_date' => '2026-10-20',
            'status' => 'completed',
            'created_by' => $this->ketua->id,
        ]);
    }

    private function participant(string $result): RankPromotionParticipant
    {
        $student = $this->makeStudent($this->akademi, $this->makeClass($this->akademi), 'Arya');

        return RankPromotionParticipant::create([
            'rank_promotion_event_id' => $this->event->id,
            'akademi_id' => $this->akademi->id,
            'student_id' => $student->id,
            'from_rank_id' => SportRank::where('code', 'tkd-geup-9')->value('id'),
            'to_rank_id' => SportRank::where('code', 'tkd-geup-8')->value('id'),
            'result' => $result,
            'score' => 88,
            'assessed_by' => $this->ketua->id,
        ]);
    }

    private function certificateUrl(RankPromotionParticipant $participant, ?RankPromotionEvent $event = null): string
    {
        $event ??= $this->event;

        return "/api/akademi/rank-promotions/{$event->id}/participants/{$participant->id}/certificate";
    }

    public function test_passed_participant_gets_certificate_data(): void
    {
        $participant = $this->participant('passed');
        Sanctum::actingAs($this->ketua);

        $this->getJson($this->certificateUrl($participant))
            ->assertOk()
            ->assertJsonPath('certificate.certificate_number', sprintf('UKT/2026/%04d/%04d', $this->event->id, $participant->id))
            ->assertJsonPath('certificate.akademi.name', 'Akademi Garuda')
            ->assertJsonPath('certificate.student.name', 'Arya')
            ->assertJsonPath('certificate.event.name', 'UKT Oktober 2026')
            ->assertJsonPath('certificate.event.event_date', '2026-10-20')
            ->assertJsonPath('certificate.from_rank.code', 'tkd-geup-9')
            ->assertJsonPath('certificate.to_rank.code', 'tkd-geup-8')
            ->assertJsonPath('certificate.to_rank.belt_color', SportRank::where('code', 'tkd-geup-8')->value('belt_color'))
            ->assertJsonPath('certificate.score', 88)
            ->assertJsonPath('certificate.assessor', 'Sabeum Budi');
    }

    public function test_certificate_is_rejected_for_participant_who_did_not_pass(): void
    {
        Sanctum::actingAs($this->ketua);

        foreach (['registered', 'failed', 'absent'] as $result) {
            $this->getJson($this->certificateUrl($this->participant($result)))
                ->assertUnprocessable()
                ->assertJsonPath('message', 'Sertifikat hanya tersedia untuk peserta yang lulus.');
        }
    }

    public function test_coach_and_admin_can_view_certificate(): void
    {
        $participant = $this->participant('passed');

        foreach ([User::factory()->pelatih($this->akademi->id)->create(), User::factory()->akademiAdmin($this->akademi->id)->create()] as $user) {
            Sanctum::actingAs($user);
            $this->getJson($this->certificateUrl($participant))->assertOk();
        }
    }

    public function test_certificate_still_available_when_academy_is_read_only(): void
    {
        $participant = $this->participant('passed');
        $this->akademi->subscriptions()->delete();
        Sanctum::actingAs($this->ketua);

        $this->getJson($this->certificateUrl($participant))->assertOk();
    }

    public function test_other_academy_cannot_view_certificate(): void
    {
        $participant = $this->participant('passed');
        $other = $this->makeAkademi('Akademi Elang');
        Sanctum::actingAs(User::factory()->ketuaAkademi($other->id)->create());

        $this->getJson($this->certificateUrl($participant))->assertNotFound();
    }

    public function test_participant_must_belong_to_event(): void
    {
        $participant = $this->participant('passed');
        $otherEvent = RankPromotionEvent::create([
            'akademi_id' => $this->akademi->id,
            'name' => 'UKT Lain',
            'event_date' => '2026-11-20',
            'status' => 'draft',
            'created_by' => $this->ketua->id,
        ]);
        Sanctum::actingAs($this->ketua);

        $this->getJson($this->certificateUrl($participant, $otherEvent))->assertNotFound();
    }
}
