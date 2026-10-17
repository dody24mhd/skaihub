<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReservedAkademiSlugTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->superAdmin()->create());
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Akademi Baru',
            'sport_type' => 'taekwondo',
            'plan' => 'starter',
            'ketua_name' => 'Ketua Baru',
            'ketua_email' => 'ketua-baru@example.com',
            'ketua_password' => 'password123',
        ], $overrides);
    }

    public function test_reserved_subdomains_are_configured_in_one_place(): void
    {
        $this->assertEqualsCanonicalizing(
            ['www', 'app', 'api', 'admin', 'mail', 'static', 'cdn', 'status'],
            config('skaihub.reserved_subdomains'),
        );
    }

    public function test_create_akademi_rejects_reserved_slug_with_indonesian_message(): void
    {
        $response = $this->postJson('/api/super-admin/akademi', $this->payload(['slug' => 'www']));

        $response->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->assertStringContainsString('dicadangkan', $response->json('errors.slug.0'));
        $this->assertDatabaseMissing('akademi', ['slug' => 'www']);
    }

    public function test_update_akademi_rejects_reserved_slug(): void
    {
        $akademi = Akademi::create([
            'name' => 'Satria Academy',
            'slug' => 'satria',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $this->putJson("/api/super-admin/akademi/{$akademi->id}", ['slug' => 'api'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('slug');

        $this->assertDatabaseHas('akademi', ['id' => $akademi->id, 'slug' => 'satria']);
    }

    public function test_auto_generated_slug_avoids_reserved_subdomain(): void
    {
        $response = $this->postJson('/api/super-admin/akademi', $this->payload(['name' => 'App']));

        $response->assertCreated();
        $slug = $response->json('akademi.slug');
        $this->assertNotSame('app', $slug);
        $this->assertStringStartsWith('app-', $slug);
        $this->assertNotContains($slug, config('skaihub.reserved_subdomains'));
    }
}
