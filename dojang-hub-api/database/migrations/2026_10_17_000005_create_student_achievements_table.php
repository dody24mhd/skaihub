<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('title', 255);
            $table->string('event_name', 255)->nullable();
            $table->date('achieved_on')->nullable();
            $table->string('result_label', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('akademi_id');
            $table->index(['akademi_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_achievements');
    }
};
