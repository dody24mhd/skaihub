<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. akademi
        Schema::create('akademi', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 100)->unique();
            $table->string('sport_type', 50)->default('taekwondo');
            $table->string('logo_url', 500)->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->enum('plan', ['starter', 'pro', 'scale'])->default('starter');
            $table->timestamp('plan_expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. subscriptions
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->enum('plan', ['starter', 'pro', 'scale']);
            $table->enum('duration_type', ['trial', 'monthly', 'quarterly', 'semester', 'yearly', 'custom'])->default('monthly');
            $table->unsignedInteger('duration_months')->nullable();
            $table->unsignedInteger('included_student_limit');
            $table->unsignedInteger('extra_student_blocks')->default(0);
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->decimal('subtotal_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('amount', 12, 2)->default(0);
            $table->enum('payment_status', ['unpaid', 'paid', 'waived', 'refunded'])->default('unpaid');
            $table->string('payment_method', 100)->nullable();
            $table->string('payment_proof_url', 500)->nullable();
            $table->enum('status', ['trialing', 'active', 'past_due', 'expired', 'cancelled'])->default('active');
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['akademi_id', 'status']);
            $table->index('ends_at');
        });

        // 3. users - tambah kolom ke tabel existing
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('akademi_id')->nullable()->after('id')
                ->constrained('akademi')->nullOnDelete();
            $table->enum('role', ['super_admin', 'admin', 'ketua_akademi', 'admin_akademi', 'pelatih'])
                ->default('admin_akademi')->after('akademi_id');
            $table->string('avatar_url', 500)->nullable()->after('email');
            $table->boolean('is_active')->default(true)->after('avatar_url');
            $table->softDeletes();
        });

        // 4. coach profiles
        Schema::create('coach_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('phone', 30)->nullable();
            $table->string('license_number', 100)->nullable();
            $table->string('rank_label', 100)->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->date('joined_date')->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique('user_id');
        });

        // 5. sport ranks
        Schema::create('sport_ranks', function (Blueprint $table) {
            $table->id();
            $table->string('sport_type', 50);
            $table->string('code', 50);
            $table->string('label', 100);
            $table->unsignedInteger('sequence');
            $table->timestamps();

            $table->unique(['sport_type', 'code']);
        });

        // 6. training places
        Schema::create('training_places', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 7. classes / units
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('training_place_id')->nullable()->constrained('training_places')->nullOnDelete();
            $table->string('name', 150);
            $table->decimal('spp_amount_override', 12, 2)->nullable();
            $table->unsignedTinyInteger('target_sessions_per_month')->default(4);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 8. students
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('current_rank_id')->nullable()->constrained('sport_ranks')->nullOnDelete();
            $table->foreignId('primary_class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('member_number', 100);
            $table->string('name', 150);
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date');
            $table->date('joined_date');
            $table->enum('status', ['active', 'inactive', 'alumni'])->default('active');
            $table->unsignedSmallInteger('height_cm');
            $table->decimal('weight_kg', 5, 2);
            $table->string('student_phone', 30)->nullable();
            $table->string('guardian_name', 150)->nullable();
            $table->string('guardian_phone', 30)->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->text('address')->nullable();
            $table->string('shirt_size', 50)->nullable();
            $table->string('school_name', 150)->nullable();
            $table->string('school_grade', 50)->nullable();
            $table->text('health_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['akademi_id', 'member_number']);
        });

        // 9. recurring training schedules
        Schema::create('training_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('training_place_id')->nullable()->constrained('training_places')->nullOnDelete();
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('starts_at');
            $table->time('ends_at');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['akademi_id', 'day_of_week']);
            $table->index(['class_id', 'is_active']);
        });

        Schema::create('training_schedule_coaches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_schedule_id')->constrained('training_schedules')->cascadeOnDelete();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['training_schedule_id', 'coach_id']);
        });

        // 10. actual training sessions and attendance
        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('training_schedule_id')->nullable()->constrained('training_schedules')->nullOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('training_place_id')->nullable()->constrained('training_places')->nullOnDelete();
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('session_date');
            $table->date('source_schedule_date')->nullable();
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('material', 255)->nullable();
            $table->text('notes')->nullable();
            $table->json('photo_urls')->nullable();
            $table->enum('session_type', ['regular', 'replacement', 'extra'])->default('regular');
            $table->enum('status', ['draft', 'completed', 'cancelled'])->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['akademi_id', 'session_date']);
            $table->index(['class_id', 'session_date']);
            $table->index(['training_schedule_id', 'session_date']);
            $table->index(['training_schedule_id', 'source_schedule_date']);
        });

        Schema::create('training_session_coaches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_session_id')->constrained('training_sessions')->cascadeOnDelete();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['training_session_id', 'coach_id']);
        });

        Schema::create('training_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_session_id')->constrained('training_sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('participant_name', 150)->nullable();
            $table->boolean('is_extra_participant')->default(false);
            $table->enum('status', ['present', 'absent', 'excused'])->default('absent');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['training_session_id', 'student_id']);
        });

        // 11. SPP monthly billing
        Schema::create('spp_bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->unsignedSmallInteger('billing_year');
            $table->unsignedTinyInteger('billing_month');
            $table->decimal('amount', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->enum('status', ['unpaid', 'partial', 'paid', 'waived'])->default('unpaid');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['akademi_id', 'student_id', 'billing_year', 'billing_month']);
            $table->index(['akademi_id', 'billing_year', 'billing_month', 'status']);
        });

        Schema::create('spp_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spp_bill_id')->constrained('spp_bills')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('paid_at');
            $table->string('method', 50)->nullable();
            $table->string('proof_url', 500)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 12. student evaluations / report periods
        Schema::create('evaluation_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('name', 150);
            $table->date('starts_at');
            $table->date('ends_at');
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['akademi_id', 'status']);
        });

        Schema::create('evaluation_aspects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('evaluation_period_id')->constrained('evaluation_periods')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('category', 100)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['akademi_id', 'evaluation_period_id', 'is_active']);
        });

        Schema::create('student_evaluation_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('evaluation_period_id')->constrained('evaluation_periods')->cascadeOnDelete();
            $table->foreignId('evaluation_aspect_id')->constrained('evaluation_aspects')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('score');
            $table->string('indicator', 50);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['evaluation_period_id', 'evaluation_aspect_id', 'student_id']);
            $table->index(['akademi_id', 'evaluation_period_id', 'student_id']);
        });

        // 13. student rank promotions / exam events
        Schema::create('rank_promotion_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('name', 150);
            $table->date('event_date');
            $table->enum('status', ['draft', 'completed', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['akademi_id', 'event_date']);
        });

        Schema::create('rank_promotion_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rank_promotion_event_id')->constrained('rank_promotion_events')->cascadeOnDelete();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('from_rank_id')->nullable()->constrained('sport_ranks')->nullOnDelete();
            $table->foreignId('to_rank_id')->constrained('sport_ranks')->cascadeOnDelete();
            $table->enum('result', ['registered', 'passed', 'failed', 'absent'])->default('registered');
            $table->unsignedSmallInteger('score')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['rank_promotion_event_id', 'student_id']);
            $table->index(['akademi_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['akademi_id']);
            $table->dropSoftDeletes();
            $table->dropColumn(['akademi_id', 'role', 'avatar_url', 'is_active']);
        });

        Schema::dropIfExists('student_evaluation_scores');
        Schema::dropIfExists('rank_promotion_participants');
        Schema::dropIfExists('rank_promotion_events');
        Schema::dropIfExists('evaluation_aspects');
        Schema::dropIfExists('evaluation_periods');
        Schema::dropIfExists('spp_payments');
        Schema::dropIfExists('spp_bills');
        Schema::dropIfExists('training_attendances');
        Schema::dropIfExists('training_session_coaches');
        Schema::dropIfExists('training_sessions');
        Schema::dropIfExists('training_schedule_coaches');
        Schema::dropIfExists('training_schedules');
        Schema::dropIfExists('students');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('training_places');
        Schema::dropIfExists('sport_ranks');
        Schema::dropIfExists('coach_profiles');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('akademi');
    }
};
