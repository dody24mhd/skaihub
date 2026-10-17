<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CsvExportSecurityTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Akademi Satria',
            'slug' => 'akademi-satria',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        Sanctum::actingAs($this->admin);
    }

    public function test_csv_export_escapes_formula_injection_characters(): void
    {
        $this->akademi->siswa()->create([
            'member_number' => '@MBR-001',
            'name' => '=HYPERLINK("http://evil.com","Pwned")',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 150,
            'weight_kg' => 45,
            'status' => 'active',
            'guardian_name' => '+62812345678',
            'guardian_phone' => '-08123456',
        ]);

        $response = $this->get('/api/akademi/exports/students')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $content = $response->streamedContent();

        $this->assertStringContainsString("'=HYPERLINK(\"\"http://evil.com\"\",\"\"Pwned\"\")", $content);
        $this->assertStringContainsString("'@MBR-001", $content);
        $this->assertStringContainsString("'+62812345678", $content);
        $this->assertStringContainsString("'-08123456", $content);
    }
}
