<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SppBill;
use App\Models\SppPayment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SppPaymentAkademiIdTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private Student $student;

    private SppBill $bill;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Akademi Cendrawasih',
            'slug' => 'akademi-cendrawasih',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        Sanctum::actingAs($this->admin);

        $this->student = $this->akademi->siswa()->create([
            'member_number' => 'CDW-001',
            'name' => 'Romi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
        ]);

        $this->bill = $this->akademi->sppBills()->create([
            'student_id' => $this->student->id,
            'billing_year' => 2026,
            'billing_month' => 5,
            'amount' => 150000,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ]);
    }

    public function test_new_spp_payment_persists_akademi_id(): void
    {
        $response = $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 50000,
            'paid_at' => '2026-05-10',
            'method' => 'transfer',
        ])->assertOk();

        $this->assertDatabaseHas('spp_payments', [
            'spp_bill_id' => $this->bill->id,
            'akademi_id' => $this->akademi->id,
            'amount' => 50000,
        ]);

        $payment = SppPayment::where('spp_bill_id', $this->bill->id)->first();
        $this->assertNotNull($payment);
        $this->assertSame($this->akademi->id, $payment->akademi_id);
    }

    public function test_backfill_updates_existing_null_akademi_id_from_bill(): void
    {
        // Insert a payment with null akademi_id directly into DB
        $paymentId = DB::table('spp_payments')->insertGetId([
            'spp_bill_id' => $this->bill->id,
            'akademi_id' => null,
            'amount' => 30000,
            'paid_at' => '2026-05-12',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Run backfill SQL statement
        DB::statement('UPDATE spp_payments SET akademi_id = (SELECT akademi_id FROM spp_bills WHERE spp_bills.id = spp_payments.spp_bill_id) WHERE akademi_id IS NULL');

        $this->assertDatabaseHas('spp_payments', [
            'id' => $paymentId,
            'akademi_id' => $this->akademi->id,
        ]);
    }
}
