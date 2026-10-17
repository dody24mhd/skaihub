<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\EvaluationAspect;
use App\Models\EvaluationPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EvaluationAspectCopyTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademiA;

    private Akademi $akademiB;

    private EvaluationPeriod $source;

    private EvaluationPeriod $target;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademiA = Akademi::create(['name' => 'Garuda', 'slug' => 'garuda', 'sport_type' => 'taekwondo', 'status' => 'active', 'plan' => 'starter']);
        $this->akademiB = Akademi::create(['name' => 'Elang', 'slug' => 'elang', 'sport_type' => 'taekwondo', 'status' => 'active', 'plan' => 'starter']);

        $this->source = $this->period($this->akademiA, 'Semester 1');
        $this->target = $this->period($this->akademiA, 'Semester 2');

        $this->aspect($this->source, 'Tendangan', 1, 'Teknik');
        $this->aspect($this->source, 'Disiplin', 2, 'Sikap', false);
        $this->aspect($this->source, 'Poomsae', 3, 'Teknik');
    }

    private function period(Akademi $akademi, string $name): EvaluationPeriod
    {
        return EvaluationPeriod::create([
            'akademi_id' => $akademi->id,
            'name' => $name,
            'starts_at' => '2026-01-01',
            'ends_at' => '2026-06-30',
            'status' => 'draft',
        ]);
    }

    private function aspect(EvaluationPeriod $period, string $name, int $order, ?string $category = null, bool $active = true): EvaluationAspect
    {
        return EvaluationAspect::create([
            'akademi_id' => $period->akademi_id,
            'evaluation_period_id' => $period->id,
            'name' => $name,
            'category' => $category,
            'sort_order' => $order,
            'is_active' => $active,
            'description' => "Deskripsi {$name}",
        ]);
    }

    private function copyUrl(EvaluationPeriod $target, EvaluationPeriod $source): string
    {
        return "/api/akademi/evaluations/periods/{$target->id}/aspects/copy-from/{$source->id}";
    }

    public function test_admin_copies_aspects_from_another_period(): void
    {
        Sanctum::actingAs(User::factory()->akademiAdmin($this->akademiA->id)->create());

        $this->postJson($this->copyUrl($this->target, $this->source))
            ->assertCreated()
            ->assertJsonPath('copied_count', 3)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Tendangan')
            ->assertJsonPath('data.0.evaluation_period_id', $this->target->id)
            ->assertJsonPath('data.1.is_active', false);

        $this->assertDatabaseHas('evaluation_aspects', [
            'evaluation_period_id' => $this->target->id,
            'akademi_id' => $this->akademiA->id,
            'name' => 'Poomsae',
            'category' => 'Teknik',
            'description' => 'Deskripsi Poomsae',
        ]);
        $this->assertSame(3, EvaluationAspect::where('evaluation_period_id', $this->source->id)->count());
    }

    public function test_copy_skips_aspects_already_in_target_and_appends_order(): void
    {
        Sanctum::actingAs(User::factory()->ketuaAkademi($this->akademiA->id)->create());
        $this->aspect($this->target, 'tendangan', 5);

        $this->postJson($this->copyUrl($this->target, $this->source))
            ->assertCreated()
            ->assertJsonPath('copied_count', 2)
            ->assertJsonCount(3, 'data');

        $this->assertSame(1, EvaluationAspect::where('evaluation_period_id', $this->target->id)->whereRaw('LOWER(name) = ?', ['tendangan'])->count());
        $this->assertSame(7, EvaluationAspect::where('evaluation_period_id', $this->target->id)->where('name', 'Disiplin')->value('sort_order'));
    }

    public function test_copy_ignores_soft_deleted_source_aspects(): void
    {
        Sanctum::actingAs(User::factory()->akademiAdmin($this->akademiA->id)->create());
        EvaluationAspect::where('name', 'Poomsae')->first()->delete();

        $this->postJson($this->copyUrl($this->target, $this->source))
            ->assertCreated()
            ->assertJsonPath('copied_count', 2);
    }

    public function test_cannot_copy_period_into_itself(): void
    {
        Sanctum::actingAs(User::factory()->akademiAdmin($this->akademiA->id)->create());

        $this->postJson($this->copyUrl($this->source, $this->source))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Pilih periode sumber yang berbeda.');
    }

    public function test_coach_cannot_copy_aspects(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademiA->id)->create());

        $this->postJson($this->copyUrl($this->target, $this->source))->assertForbidden();
        $this->assertSame(0, EvaluationAspect::where('evaluation_period_id', $this->target->id)->count());
    }

    public function test_cannot_copy_from_other_akademi_period(): void
    {
        $foreign = $this->period($this->akademiB, 'Periode Elang');
        $this->aspect($foreign, 'Rahasia Elang', 1);
        Sanctum::actingAs(User::factory()->akademiAdmin($this->akademiA->id)->create());

        $this->postJson($this->copyUrl($this->target, $foreign))->assertNotFound();
        $this->assertDatabaseMissing('evaluation_aspects', [
            'evaluation_period_id' => $this->target->id,
            'name' => 'Rahasia Elang',
        ]);
    }

    public function test_cannot_copy_into_other_akademi_period(): void
    {
        $foreign = $this->period($this->akademiB, 'Periode Elang');
        Sanctum::actingAs(User::factory()->akademiAdmin($this->akademiB->id)->create());

        $this->postJson($this->copyUrl($foreign, $this->source))->assertNotFound();
        $this->assertSame(0, EvaluationAspect::where('evaluation_period_id', $foreign->id)->count());
    }
}
