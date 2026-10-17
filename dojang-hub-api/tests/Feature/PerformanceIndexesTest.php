<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PerformanceIndexesTest extends TestCase
{
    use RefreshDatabase;

    public function test_performance_indexes_exist(): void
    {
        $this->assertTrue(
            Schema::hasIndex('training_attendances', ['student_id']),
            'Missing index on training_attendances(student_id)'
        );

        $this->assertTrue(
            Schema::hasIndex('spp_payments', ['spp_bill_id']),
            'Missing index on spp_payments(spp_bill_id)'
        );

        $this->assertTrue(
            Schema::hasIndex('students', ['akademi_id', 'status']),
            'Missing index on students(akademi_id, status)'
        );

        $this->assertTrue(
            Schema::hasIndex('users', ['akademi_id', 'role']),
            'Missing index on users(akademi_id, role)'
        );

        $this->assertTrue(
            Schema::hasIndex('classes', ['akademi_id']),
            'Missing index on classes(akademi_id)'
        );
    }
}
