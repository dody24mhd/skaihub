<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SppBill;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SppBillEventTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Akademi Harimau',
            'slug' => 'akademi-harimau',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
        $this->giveActiveSubscription($this->akademi);
        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        $this->student = $this->akademi->siswa()->create([
            'member_number' => 'HRM-001',
            'name' => 'Doni',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
        ]);
        Sanctum::actingAs($this->admin);
    }

    private function makeBill(string $status = 'unpaid', float $paid = 0): SppBill
    {
        return $this->akademi->sppBills()->create([
            'student_id' => $this->student->id,
            'billing_year' => 2026,
            'billing_month' => 10,
            'amount' => 100000,
            'paid_amount' => $paid,
            'status' => $status,
        ]);
    }

    public function test_generate_writes_created_event_per_bill(): void
    {
        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 10,
            'default_amount' => 100000,
        ])->assertCreated();

        $bill = SppBill::firstOrFail();
        $this->assertDatabaseHas('spp_bill_events', [
            'akademi_id' => $this->akademi->id,
            'spp_bill_id' => $bill->id,
            'type' => 'created',
            'amount' => '100000.00',
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_pay_writes_payment_event(): void
    {
        $bill = $this->makeBill();

        $this->postJson("/api/akademi/spp-bills/{$bill->id}/payments", [
            'amount' => 40000,
            'paid_at' => '2026-10-05',
            'notes' => 'Cicilan pertama',
        ])->assertOk();

        $this->assertDatabaseHas('spp_bill_events', [
            'spp_bill_id' => $bill->id,
            'type' => 'payment',
            'amount' => '40000.00',
            'user_id' => $this->admin->id,
            'notes' => 'Cicilan pertama',
        ]);
    }

    public function test_waive_unpaid_bill_writes_event_without_reason(): void
    {
        $bill = $this->makeBill();

        $this->patchJson("/api/akademi/spp-bills/{$bill->id}/waive", [])
            ->assertOk()
            ->assertJsonPath('spp_bill.status', 'waived');

        $this->assertDatabaseHas('spp_bill_events', [
            'spp_bill_id' => $bill->id,
            'type' => 'waived',
            'amount' => '100000.00',
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_waive_partially_paid_bill_requires_reason(): void
    {
        $bill = $this->makeBill('partial', 40000);

        $this->patchJson("/api/akademi/spp-bills/{$bill->id}/waive", ['notes' => 'tanpa alasan'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);

        $this->assertSame('partial', $bill->fresh()->status);
        $this->assertDatabaseCount('spp_bill_events', 0);

        $this->patchJson("/api/akademi/spp-bills/{$bill->id}/waive", ['reason' => 'Keringanan keluarga'])
            ->assertOk()
            ->assertJsonPath('spp_bill.status', 'waived');

        $this->assertDatabaseHas('spp_bill_events', [
            'spp_bill_id' => $bill->id,
            'type' => 'waived',
            'amount' => '60000.00',
            'notes' => 'Keringanan keluarga',
        ]);
    }

    public function test_cannot_waive_paid_or_already_waived_bill(): void
    {
        $paid = $this->makeBill('paid', 100000);

        $this->patchJson("/api/akademi/spp-bills/{$paid->id}/waive", ['reason' => 'x'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        $this->assertSame('paid', $paid->fresh()->status);
    }

    public function test_waive_is_tenant_scoped(): void
    {
        $bill = $this->makeBill();
        $other = Akademi::create([
            'name' => 'Akademi Elang',
            'slug' => 'akademi-elang',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
        $this->giveActiveSubscription($other);
        Sanctum::actingAs(User::factory()->akademiAdmin($other->id)->create());

        $this->patchJson("/api/akademi/spp-bills/{$bill->id}/waive", [])->assertNotFound();
        $this->assertDatabaseCount('spp_bill_events', 0);
    }
}
