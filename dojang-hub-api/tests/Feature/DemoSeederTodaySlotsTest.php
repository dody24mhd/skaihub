<?php

namespace Tests\Feature;

use App\Models\TrainingSession;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regresi temuan E2E integrasi (L5-A): sesi demo tanpa source_schedule_date membuat
 * "Kelas Hari Ini" menampilkan slot jadwal ganda (satu "Belum Dibuka" + satu "Draft").
 */
class DemoSeederTodaySlotsTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_schedule_sessions_match_their_slot_without_duplicates(): void
    {
        $this->travelTo('2026-10-17 08:00:00'); // Sabtu: jadwal Kelas Prestasi 08:00
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(
            0,
            TrainingSession::whereNotNull('training_schedule_id')
                ->where('session_type', 'regular')
                ->whereNull('source_schedule_date')
                ->count(),
        );

        Sanctum::actingAs(User::where('email', 'ketua@garudasakti.test')->firstOrFail());
        $response = $this->getJson('/api/akademi/sessions/today?date=2026-10-17')->assertOk();

        $slots = collect($response->json('data'))->where('class_name', 'Kelas Prestasi');
        $this->assertCount(1, $slots, 'Satu jadwal pada satu tanggal harus menjadi satu slot.');
        $this->assertSame('draft', $slots->first()['status']);
    }
}
