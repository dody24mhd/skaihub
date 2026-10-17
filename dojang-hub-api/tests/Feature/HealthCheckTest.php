<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_returns_ok_without_authentication(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'db' => true,
                'time' => $response->json('time'),
            ]);
        $this->assertNotFalse(strtotime((string) $response->json('time')));
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function test_health_reports_database_down_with_503_without_leaking_details(): void
    {
        config(['database.connections.sqlite.database' => storage_path('missing-dir/nope/health.sqlite')]);
        DB::purge('sqlite');

        $response = $this->getJson('/api/health');

        $response->assertStatus(503)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('db', false);
        $this->assertSame(['status', 'db', 'time'], array_keys($response->json()));
        $this->assertStringNotContainsString('missing-dir', $response->getContent());
    }

    public function test_health_is_not_strictly_rate_limited(): void
    {
        for ($i = 0; $i < 40; $i++) {
            $this->getJson('/api/health')->assertOk();
        }
    }
}
