<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_rank_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('sport_rank_id')->constrained('sport_ranks')->cascadeOnDelete();
            $table->date('achieved_on');
            $table->string('source_type', 30)->default('manual');
            $table->foreignId('rank_promotion_participant_id')->nullable()->constrained('rank_promotion_participants')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('akademi_id');
            $table->index(['student_id', 'achieved_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_rank_histories');
    }
};
