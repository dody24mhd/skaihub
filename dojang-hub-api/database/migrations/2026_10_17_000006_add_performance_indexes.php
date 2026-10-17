<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_attendances', function (Blueprint $table) {
            $table->index('student_id');
        });

        Schema::table('spp_payments', function (Blueprint $table) {
            $table->index('spp_bill_id');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->index(['akademi_id', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['akademi_id', 'role']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->index('akademi_id');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropIndex(['akademi_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['akademi_id', 'role']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['akademi_id', 'status']);
        });

        Schema::table('spp_payments', function (Blueprint $table) {
            $table->dropIndex(['spp_bill_id']);
        });

        Schema::table('training_attendances', function (Blueprint $table) {
            $table->dropIndex(['student_id']);
        });
    }
};
