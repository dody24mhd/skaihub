<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SppBill;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SppPaymentSecurityTest extends TestCase
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
            'name' => 'Akademi Harimau',
            'slug' => 'akademi-harimau',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

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

        $this->bill = $this->akademi->sppBills()->create([
            'student_id' => $this->student->id,
            'billing_year' => 2026,
            'billing_month' => 5,
            'amount' => 100000,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($this->admin);
    }

    public function test_cannot_pay_already_paid_bill(): void
    {
        $this->bill->update([
            'status' => 'paid',
            'paid_amount' => 100000,
        ]);

        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_cannot_pay_waived_bill(): void
    {
        $this->bill->update([
            'status' => 'waived',
        ]);

        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_cannot_overpay_remaining_amount(): void
    {
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 150000,
            'paid_at' => '2026-05-10',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_cannot_use_external_or_other_academy_proof_url(): void
    {
        // External domain
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 50000,
            'paid_at' => '2026-05-10',
            'proof_url' => 'https://external-website.com/fake-receipt.png',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['proof_url']);

        // Another academy's proof url
        $otherAkademiId = $this->akademi->id + 99;
        $otherProof = Storage::disk('public')->url("akademi/{$otherAkademiId}/spp-proofs/receipt.png");

        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 50000,
            'paid_at' => '2026-05-10',
            'proof_url' => $otherProof,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['proof_url']);
    }

    public function test_partial_payment_then_full_payment_updates_status_correctly(): void
    {
        Storage::disk('public')->put("akademi/{$this->akademi->id}/spp-proofs/receipt.png", 'fake receipt');
        $validProof = Storage::disk('public')->url("akademi/{$this->akademi->id}/spp-proofs/receipt.png");

        // Partial payment 40,000 of 100,000
        $res1 = $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 40000,
            'paid_at' => '2026-05-10',
            'proof_url' => $validProof,
        ])->assertOk();

        $this->assertSame('partial', $res1->json('spp_bill.status'));
        $this->assertEquals(40000, (float) $res1->json('spp_bill.paid_amount'));

        // Overpay beyond remaining 60,000 should fail
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 60001,
            'paid_at' => '2026-05-11',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);

        // Remaining 60,000 succeeds and marks bill as paid
        $res2 = $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 60000,
            'paid_at' => '2026-05-11',
        ])->assertOk();

        $this->assertSame('paid', $res2->json('spp_bill.status'));
        $this->assertEquals(100000, (float) $res2->json('spp_bill.paid_amount'));
    }

    public function test_proof_url_security_bypass_attempts_are_rejected(): void
    {
        $id = $this->akademi->id;
        $otherId = $id + 99;

        // Directory traversal with ..
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$id}/../{$otherId}/x.jpg",
        ])->assertStatus(422)->assertJsonValidationErrors(['proof_url']);

        // URL encoded traversal %2e%2e
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$id}/%2e%2e/{$otherId}/x.jpg",
        ])->assertStatus(422)->assertJsonValidationErrors(['proof_url']);

        // Backslash
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$id}\\..\\{$otherId}\\x.jpg",
        ])->assertStatus(422)->assertJsonValidationErrors(['proof_url']);

        // Query string
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$id}/spp-proofs/receipt.png?download=1",
        ])->assertStatus(422)->assertJsonValidationErrors(['proof_url']);

        // Fragment
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$id}/spp-proofs/receipt.png#section",
        ])->assertStatus(422)->assertJsonValidationErrors(['proof_url']);

        // Other academy
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$otherId}/spp-proofs/receipt.png",
        ])->assertStatus(422)->assertJsonValidationErrors(['proof_url']);

        // Non-existent file on public storage
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$id}/spp-proofs/nonexistent.png",
        ])->assertStatus(422)->assertJsonValidationErrors(['proof_url']);

        // Valid file existing on public storage
        Storage::disk('public')->put("akademi/{$id}/spp-proofs/legit.png", 'proof content');
        $this->postJson("/api/akademi/spp-bills/{$this->bill->id}/payments", [
            'amount' => 10000,
            'paid_at' => '2026-05-10',
            'proof_url' => "/storage/akademi/{$id}/spp-proofs/legit.png",
        ])->assertOk();
    }
}
