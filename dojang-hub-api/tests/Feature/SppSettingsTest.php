<?php

namespace Tests\Feature;

use App\Models\AcademySppSetting;
use App\Models\Akademi;
use App\Models\SppBill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SppSettingsTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = $this->makeAkademi('akademi-harimau');
        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
    }

    private function makeAkademi(string $slug): Akademi
    {
        return Akademi::create([
            'name' => 'Akademi '.$slug,
            'slug' => $slug,
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
    }

    private function makeStudent(Akademi $akademi, string $name, ?int $classId = null): void
    {
        $akademi->siswa()->create([
            'member_number' => strtoupper(substr($name, 0, 3)).'-'.random_int(100, 999),
            'name' => $name,
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
            'primary_class_id' => $classId,
        ]);
    }

    public function test_settings_return_defaults_when_not_configured(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/akademi/spp-settings')
            ->assertOk()
            ->assertJsonPath('spp_settings.default_monthly_amount', null)
            ->assertJsonPath('spp_settings.due_day', 10);
    }

    public function test_ketua_can_update_settings(): void
    {
        Sanctum::actingAs(User::factory()->ketuaAkademi($this->akademi->id)->create());

        $this->putJson('/api/akademi/spp-settings', [
            'default_monthly_amount' => 175000,
            'due_day' => 5,
        ])->assertOk()
            ->assertJsonPath('spp_settings.default_monthly_amount', '175000.00')
            ->assertJsonPath('spp_settings.due_day', 5);

        $this->assertDatabaseHas('academy_spp_settings', [
            'akademi_id' => $this->akademi->id,
            'due_day' => 5,
        ]);

        $this->putJson('/api/akademi/spp-settings', [
            'default_monthly_amount' => null,
            'due_day' => 28,
        ])->assertOk()->assertJsonPath('spp_settings.default_monthly_amount', null);

        $this->assertDatabaseCount('academy_spp_settings', 1);
    }

    public function test_settings_validation_rejects_invalid_due_day_and_amount(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson('/api/akademi/spp-settings', [
            'default_monthly_amount' => -1,
            'due_day' => 29,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['default_monthly_amount', 'due_day']);
    }

    public function test_pelatih_cannot_read_or_update_settings(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->getJson('/api/akademi/spp-settings')->assertForbidden();
        $this->putJson('/api/akademi/spp-settings', ['due_day' => 5])->assertForbidden();
    }

    public function test_settings_are_scoped_per_akademi(): void
    {
        $other = $this->makeAkademi('akademi-elang');
        Sanctum::actingAs(User::factory()->akademiAdmin($other->id)->create());
        $this->putJson('/api/akademi/spp-settings', ['default_monthly_amount' => 99000, 'due_day' => 3])->assertOk();

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/akademi/spp-settings')
            ->assertOk()
            ->assertJsonPath('spp_settings.default_monthly_amount', null)
            ->assertJsonPath('spp_settings.due_day', 10);
    }

    public function test_generate_uses_class_override_then_request_amount_then_akademi_default(): void
    {
        $classWithOverride = $this->akademi->trainingClasses()->create(['name' => 'Junior', 'spp_amount_override' => 150000]);
        $plainClass = $this->akademi->trainingClasses()->create(['name' => 'Senior']);
        $this->makeStudent($this->akademi, 'Ani', $classWithOverride->id);
        $this->makeStudent($this->akademi, 'Budi', $plainClass->id);
        AcademySppSetting::create(['akademi_id' => $this->akademi->id, 'default_monthly_amount' => 120000, 'due_day' => 10]);
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 10,
        ])->assertCreated()->assertJsonPath('created', 2);

        $this->assertSame('150000.00', SppBill::whereHas('student', fn ($q) => $q->where('name', 'Ani'))->first()->amount);
        $this->assertSame('120000.00', SppBill::whereHas('student', fn ($q) => $q->where('name', 'Budi'))->first()->amount);

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 11,
            'default_amount' => 130000,
        ])->assertCreated();

        $this->assertSame('130000.00', SppBill::where('billing_month', 11)->whereHas('student', fn ($q) => $q->where('name', 'Budi'))->first()->amount);
        $this->assertSame('150000.00', SppBill::where('billing_month', 11)->whereHas('student', fn ($q) => $q->where('name', 'Ani'))->first()->amount);
    }

    public function test_generate_skips_students_without_any_amount_source(): void
    {
        $this->makeStudent($this->akademi, 'Citra');
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 10,
        ])->assertCreated()
            ->assertJsonPath('created', 0)
            ->assertJsonPath('missing_amount', 1);
    }

    public function test_generate_defaults_due_date_to_configured_due_day(): void
    {
        $this->makeStudent($this->akademi, 'Dodi');
        AcademySppSetting::create(['akademi_id' => $this->akademi->id, 'default_monthly_amount' => 100000, 'due_day' => 15]);
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 2,
        ])->assertCreated();

        $this->assertSame('2026-02-15', SppBill::first()->due_date->toDateString());
    }

    public function test_generate_due_date_falls_back_to_day_ten_and_respects_explicit_due_date(): void
    {
        $this->makeStudent($this->akademi, 'Eka');
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 3,
            'default_amount' => 100000,
        ])->assertCreated();

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 4,
            'default_amount' => 100000,
            'due_date' => '2026-04-20',
        ])->assertCreated();

        $this->assertSame('2026-03-10', SppBill::where('billing_month', 3)->first()->due_date->toDateString());
        $this->assertSame('2026-04-20', SppBill::where('billing_month', 4)->first()->due_date->toDateString());
    }
}
