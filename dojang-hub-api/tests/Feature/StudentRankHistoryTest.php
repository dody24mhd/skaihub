<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\RankPromotionEvent;
use App\Models\SportRank;
use App\Models\Student;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentRankHistoryTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademiA;

    private Akademi $akademiB;

    private User $adminA;

    private User $adminB;

    private SportRank $rankWhite;

    private SportRank $rankYellow;

    private SportRank $rankGreen;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademiA = Akademi::create([
            'name' => 'Akademi Naga A',
            'slug' => 'akademi-naga-a',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->akademiB = Akademi::create([
            'name' => 'Akademi Singa B',
            'slug' => 'akademi-singa-b',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->adminA = User::factory()->akademiAdmin($this->akademiA->id)->create();
        $this->adminB = User::factory()->akademiAdmin($this->akademiB->id)->create();

        $this->app->make(SubscriptionService::class)->createInitial($this->akademiA, [
            'plan' => 'pro',
            'duration_type' => 'monthly',
        ]);

        $this->rankWhite = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'white',
            'label' => 'Sabuk Putih',
            'sequence' => 1,
        ]);

        $this->rankYellow = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'yellow',
            'label' => 'Sabuk Kuning',
            'sequence' => 2,
        ]);

        $this->rankGreen = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'green',
            'label' => 'Sabuk Hijau',
            'sequence' => 3,
        ]);
    }

    public function test_creating_student_with_rank_and_updating_rank_records_rank_histories(): void
    {
        Sanctum::actingAs($this->adminA);

        // 1. Create student with initial rank
        $createRes = $this->postJson('/api/akademi/students', [
            'name' => 'Bintang',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 145,
            'weight_kg' => 40,
            'status' => 'active',
            'current_rank_id' => $this->rankWhite->id,
        ])->assertCreated();

        $studentId = $createRes->json('student.id');

        $this->assertDatabaseHas('student_rank_histories', [
            'student_id' => $studentId,
            'sport_rank_id' => $this->rankWhite->id,
            'source_type' => 'manual',
            'akademi_id' => $this->akademiA->id,
        ]);

        // 2. Update student rank to Yellow
        $this->putJson("/api/akademi/students/{$studentId}", [
            'current_rank_id' => $this->rankYellow->id,
        ])->assertOk();

        $this->assertDatabaseHas('student_rank_histories', [
            'student_id' => $studentId,
            'sport_rank_id' => $this->rankYellow->id,
            'source_type' => 'manual',
            'akademi_id' => $this->akademiA->id,
        ]);

        // 3. Read rank histories endpoint
        $historyRes = $this->getJson("/api/akademi/students/{$studentId}/rank-histories")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->assertSame($this->rankYellow->id, $historyRes->json('data.0.sport_rank_id'));
        $this->assertSame($this->rankWhite->id, $historyRes->json('data.1.sport_rank_id'));
    }

    public function test_passed_ukt_participant_creates_promotion_event_rank_history(): void
    {
        Sanctum::actingAs($this->adminA);

        $student = $this->akademiA->siswa()->create([
            'member_number' => 'NGA-001',
            'name' => 'Fajar',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 145,
            'weight_kg' => 40,
            'status' => 'active',
            'current_rank_id' => $this->rankYellow->id,
        ]);

        $event = RankPromotionEvent::create([
            'akademi_id' => $this->akademiA->id,
            'name' => 'UKT Semester 1',
            'event_date' => '2026-06-20',
            'status' => 'draft',
        ]);

        $participant = $event->participants()->create([
            'akademi_id' => $this->akademiA->id,
            'student_id' => $student->id,
            'from_rank_id' => $this->rankYellow->id,
            'to_rank_id' => $this->rankGreen->id,
            'result' => 'registered',
        ]);

        // Grade participant as passed
        $this->patchJson("/api/akademi/rank-promotions/{$event->id}/participants/{$participant->id}", [
            'result' => 'passed',
            'score' => 90,
            'notes' => 'Lulus dengan nilai sangat baik',
        ])->assertOk();

        $this->assertDatabaseHas('student_rank_histories', [
            'student_id' => $student->id,
            'sport_rank_id' => $this->rankGreen->id,
            'source_type' => 'promotion_event',
            'rank_promotion_participant_id' => $participant->id,
            'akademi_id' => $this->akademiA->id,
        ]);

        $this->assertSame($this->rankGreen->id, $student->fresh()->current_rank_id);
    }

    public function test_ukt_participant_rank_history_is_idempotent_and_can_be_reverted(): void
    {
        Sanctum::actingAs($this->adminA);

        $student = $this->akademiA->siswa()->create([
            'member_number' => 'NGA-IDEMP',
            'name' => 'Siswa Idempoten',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 145,
            'weight_kg' => 40,
            'status' => 'active',
            'current_rank_id' => $this->rankYellow->id,
        ]);

        $event = RankPromotionEvent::create([
            'akademi_id' => $this->akademiA->id,
            'name' => 'UKT Semester Idempoten',
            'event_date' => '2026-06-20',
            'status' => 'draft',
        ]);

        $participant = $event->participants()->create([
            'akademi_id' => $this->akademiA->id,
            'student_id' => $student->id,
            'from_rank_id' => $this->rankYellow->id,
            'to_rank_id' => $this->rankGreen->id,
            'result' => 'registered',
        ]);

        // PATCH 1: passed
        $this->patchJson("/api/akademi/rank-promotions/{$event->id}/participants/{$participant->id}", [
            'result' => 'passed',
            'score' => 85,
        ])->assertOk();

        // PATCH 2: passed lagi
        $this->patchJson("/api/akademi/rank-promotions/{$event->id}/participants/{$participant->id}", [
            'result' => 'passed',
            'score' => 90,
        ])->assertOk();

        // Harus tetap 1 baris riwayat
        $this->assertSame(
            1,
            \App\Models\StudentRankHistory::where('rank_promotion_participant_id', $participant->id)->count()
        );
        $this->assertSame($this->rankGreen->id, $student->fresh()->current_rank_id);

        // Revert ke failed
        $this->patchJson("/api/akademi/rank-promotions/{$event->id}/participants/{$participant->id}", [
            'result' => 'failed',
            'score' => 50,
        ])->assertOk();

        // Riwayat UKT harus 0 baris dan rank kembali ke from_rank_id (rankYellow)
        $this->assertSame(
            0,
            \App\Models\StudentRankHistory::where('rank_promotion_participant_id', $participant->id)->count()
        );
        $this->assertSame($this->rankYellow->id, $student->fresh()->current_rank_id);
    }

    public function test_updating_student_rank_does_not_use_student_notes_for_rank_history(): void
    {
        Sanctum::actingAs($this->adminA);

        $student = $this->akademiA->siswa()->create([
            'member_number' => 'NGA-NOTES',
            'name' => 'Siswa Notes',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 145,
            'weight_kg' => 40,
            'status' => 'active',
            'current_rank_id' => $this->rankWhite->id,
        ]);

        // Update dengan rank_notes
        $this->putJson("/api/akademi/students/{$student->id}", [
            'current_rank_id' => $this->rankYellow->id,
            'rank_notes' => 'Kenaikan tingkat khusus dojang',
        ])->assertOk();

        $this->assertDatabaseHas('student_rank_histories', [
            'student_id' => $student->id,
            'sport_rank_id' => $this->rankYellow->id,
            'notes' => 'Kenaikan tingkat khusus dojang',
        ]);

        // Update tanpa rank_notes menghasilkan notes = null
        $this->putJson("/api/akademi/students/{$student->id}", [
            'current_rank_id' => $this->rankGreen->id,
        ])->assertOk();

        $this->assertDatabaseHas('student_rank_histories', [
            'student_id' => $student->id,
            'sport_rank_id' => $this->rankGreen->id,
            'notes' => null,
        ]);
    }

    public function test_tenant_isolation_on_rank_histories(): void
    {
        $studentA = $this->akademiA->siswa()->create([
            'member_number' => 'NGA-002',
            'name' => 'Siswa A',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 145,
            'weight_kg' => 40,
            'status' => 'active',
            'current_rank_id' => $this->rankWhite->id,
        ]);

        // Admin B tries to view Student A's rank histories -> 404
        Sanctum::actingAs($this->adminB);

        $this->getJson("/api/akademi/students/{$studentA->id}/rank-histories")
            ->assertNotFound();
    }
}
