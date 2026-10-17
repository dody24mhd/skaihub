<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SppBill;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SppOverdueArrearsTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-10-17 09:00:00');
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

    private function makeStudent(Akademi $akademi, string $name): Student
    {
        return $akademi->siswa()->create([
            'member_number' => strtoupper(substr($name, 0, 3)).'-'.random_int(100, 999),
            'name' => $name,
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
        ]);
    }

    private function makeBill(Student $student, int $month, string $status, ?string $dueDate, float $amount = 100000, float $paid = 0): SppBill
    {
        return SppBill::create([
            'akademi_id' => $student->akademi_id,
            'student_id' => $student->id,
            'billing_year' => 2026,
            'billing_month' => $month,
            'amount' => $amount,
            'paid_amount' => $paid,
            'due_date' => $dueDate,
            'status' => $status,
        ]);
    }

    public function test_bill_reports_is_overdue_only_when_open_and_past_due_date(): void
    {
        $student = $this->makeStudent($this->akademi, 'Ani');
        $overdue = $this->makeBill($student, 8, 'unpaid', '2026-08-10');
        $partialOverdue = $this->makeBill($student, 9, 'partial', '2026-09-10', 100000, 40000);
        $dueToday = $this->makeBill($student, 10, 'unpaid', '2026-10-17');
        $paidLate = $this->makeBill($student, 7, 'paid', '2026-07-10', 100000, 100000);
        $noDueDate = $this->makeBill($student, 6, 'unpaid', null);

        $this->assertTrue($overdue->is_overdue);
        $this->assertTrue($partialOverdue->is_overdue);
        $this->assertFalse($dueToday->is_overdue);
        $this->assertFalse($paidLate->is_overdue);
        $this->assertFalse($noDueDate->is_overdue);
    }

    public function test_index_includes_is_overdue_and_filters_overdue(): void
    {
        $student = $this->makeStudent($this->akademi, 'Ani');
        $overdue = $this->makeBill($student, 8, 'unpaid', '2026-08-10');
        $this->makeBill($student, 10, 'unpaid', '2026-10-20');
        $this->makeBill($student, 7, 'paid', '2026-07-10', 100000, 100000);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/akademi/spp-bills?year=2026&month=all')
            ->assertOk()
            ->assertJsonCount(3, 'data.data')
            ->assertJsonPath('data.data.0.is_overdue', false);

        $this->getJson('/api/akademi/spp-bills?year=2026&month=all&overdue=1')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $overdue->id)
            ->assertJsonPath('data.data.0.is_overdue', true);
    }

    public function test_arrears_groups_overdue_bills_per_student_sorted_by_total_remaining(): void
    {
        $ani = $this->makeStudent($this->akademi, 'Ani');
        $budi = $this->makeStudent($this->akademi, 'Budi');
        $citra = $this->makeStudent($this->akademi, 'Citra');
        $this->makeBill($ani, 8, 'unpaid', '2026-08-10');
        $this->makeBill($budi, 7, 'unpaid', '2026-07-10');
        $this->makeBill($budi, 8, 'partial', '2026-08-10', 100000, 25000);
        $this->makeBill($budi, 10, 'unpaid', '2026-10-25');
        $this->makeBill($citra, 8, 'paid', '2026-08-10', 100000, 100000);
        $this->makeBill($citra, 9, 'waived', '2026-09-10');
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/akademi/spp-bills/arrears')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.student.id', $budi->id)
            ->assertJsonPath('data.0.months_count', 2)
            ->assertJsonPath('data.0.total_remaining', '175000.00')
            ->assertJsonPath('data.0.oldest_due_date', '2026-07-10')
            ->assertJsonPath('data.1.student.id', $ani->id)
            ->assertJsonPath('data.1.months_count', 1)
            ->assertJsonPath('data.1.total_remaining', '100000.00');
    }

    public function test_arrears_are_tenant_scoped_and_forbidden_for_pelatih(): void
    {
        $other = $this->makeAkademi('akademi-elang');
        $this->makeBill($this->makeStudent($other, 'Orang Lain'), 8, 'unpaid', '2026-08-10');
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/akademi/spp-bills/arrears')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/akademi/spp-bills?overdue=1')->assertOk()->assertJsonCount(0, 'data.data');

        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());
        $this->getJson('/api/akademi/spp-bills/arrears')->assertForbidden();
    }
}
