<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SppBill;
use App\Models\SppPayment;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SppReceiptTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = $this->makeAkademi('akademi-harimau');
        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create(['name' => 'Admin Harimau']);
    }

    private function makeAkademi(string $slug): Akademi
    {
        $akademi = Akademi::create([
            'name' => 'Akademi '.$slug,
            'slug' => $slug,
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
        $this->giveActiveSubscription($akademi);

        return $akademi;
    }

    private function makeBill(Akademi $akademi, int $month = 10): SppBill
    {
        $class = $akademi->trainingClasses()->create(['name' => 'Junior']);
        $student = $akademi->siswa()->create([
            'member_number' => 'M-'.$akademi->id.'-'.$month,
            'name' => 'Doni',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
            'guardian_name' => 'Pak Budi',
            'guardian_phone' => '081234567890',
            'primary_class_id' => $class->id,
        ]);

        return $akademi->sppBills()->create([
            'student_id' => $student->id,
            'class_id' => $class->id,
            'billing_year' => 2026,
            'billing_month' => $month,
            'amount' => 150000,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ]);
    }

    private function pay(SppBill $bill, float $amount, string $paidAt = '2026-10-05'): SppPayment
    {
        $this->postJson("/api/akademi/spp-bills/{$bill->id}/payments", [
            'amount' => $amount,
            'paid_at' => $paidAt,
            'method' => 'transfer',
        ])->assertOk();

        return SppPayment::where('spp_bill_id', $bill->id)->latest('id')->firstOrFail();
    }

    public function test_payment_gets_sequential_receipt_number_per_month(): void
    {
        Sanctum::actingAs($this->admin);
        $bill = $this->makeBill($this->akademi);

        $first = $this->pay($bill, 50000, '2026-10-05');
        $second = $this->pay($bill, 50000, '2026-10-20');
        $third = $this->pay($bill, 50000, '2026-11-02');

        $this->assertSame('KW-202610-0001', $first->receipt_number);
        $this->assertSame('KW-202610-0002', $second->receipt_number);
        $this->assertSame('KW-202611-0001', $third->receipt_number);
    }

    public function test_receipt_numbers_are_scoped_per_akademi(): void
    {
        $other = $this->makeAkademi('akademi-elang');

        Sanctum::actingAs($this->admin);
        $mine = $this->pay($this->makeBill($this->akademi), 50000);

        Sanctum::actingAs(User::factory()->akademiAdmin($other->id)->create());
        $theirs = $this->pay($this->makeBill($other), 50000);

        $this->assertSame('KW-202610-0001', $mine->receipt_number);
        $this->assertSame('KW-202610-0001', $theirs->receipt_number);
    }

    public function test_receipt_number_is_unique_within_akademi(): void
    {
        Sanctum::actingAs($this->admin);
        $payment = $this->pay($this->makeBill($this->akademi), 50000);

        $this->expectException(QueryException::class);

        SppPayment::create([
            'akademi_id' => $this->akademi->id,
            'spp_bill_id' => $payment->spp_bill_id,
            'amount' => 1000,
            'paid_at' => '2026-10-06',
            'receipt_number' => $payment->receipt_number,
        ]);
    }

    public function test_receipt_returns_payment_details_and_remaining_at_payment_time(): void
    {
        Sanctum::actingAs($this->admin);
        $bill = $this->makeBill($this->akademi);
        $first = $this->pay($bill, 50000, '2026-10-05');
        $this->pay($bill, 30000, '2026-10-06');

        $this->getJson("/api/akademi/spp-payments/{$first->id}/receipt")
            ->assertOk()
            ->assertJsonPath('receipt.receipt_number', 'KW-202610-0001')
            ->assertJsonPath('receipt.akademi.name', 'Akademi akademi-harimau')
            ->assertJsonPath('receipt.student.name', 'Doni')
            ->assertJsonPath('receipt.student.guardian_phone', '081234567890')
            ->assertJsonPath('receipt.class_name', 'Junior')
            ->assertJsonPath('receipt.billing_year', 2026)
            ->assertJsonPath('receipt.billing_month', 10)
            ->assertJsonPath('receipt.amount', '50000.00')
            ->assertJsonPath('receipt.bill_amount', '150000.00')
            ->assertJsonPath('receipt.remaining_amount', '100000.00')
            ->assertJsonPath('receipt.method', 'transfer')
            ->assertJsonPath('receipt.paid_at', '2026-10-05')
            ->assertJsonPath('receipt.received_by', 'Admin Harimau');
    }

    public function test_receipt_of_other_akademi_is_not_found_and_pelatih_is_forbidden(): void
    {
        Sanctum::actingAs($this->admin);
        $payment = $this->pay($this->makeBill($this->akademi), 50000);

        $other = $this->makeAkademi('akademi-elang');
        Sanctum::actingAs(User::factory()->akademiAdmin($other->id)->create());
        $this->getJson("/api/akademi/spp-payments/{$payment->id}/receipt")->assertNotFound();

        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());
        $this->getJson("/api/akademi/spp-payments/{$payment->id}/receipt")->assertForbidden();
    }
}
