<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedSmallInteger('height_cm')->nullable()->change();
            $table->decimal('weight_kg', 5, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Tightening back to NOT NULL would fail (or require inventing data) once students
        // without height/weight exist, so rollback intentionally keeps the columns nullable.
    }
};
