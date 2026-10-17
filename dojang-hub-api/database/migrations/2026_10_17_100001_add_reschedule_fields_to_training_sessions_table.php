<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $this->replaceStatusCheck(['draft', 'completed', 'cancelled', 'rescheduled']);
        } else {
            Schema::table('training_sessions', function (Blueprint $table) {
                $table->string('status', 20)->default('draft')->change();
            });
        }

        Schema::table('training_sessions', function (Blueprint $table) {
            $table->text('reschedule_reason')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->foreignId('rescheduled_to_id')->nullable()->constrained('training_sessions')->nullOnDelete();
            $table->foreignId('rescheduled_from_id')->nullable()->constrained('training_sessions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('training_sessions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rescheduled_to_id');
            $table->dropConstrainedForeignId('rescheduled_from_id');
            $table->dropColumn(['reschedule_reason', 'cancel_reason']);
        });

        DB::table('training_sessions')
            ->where('status', 'rescheduled')
            ->update(['status' => 'cancelled']);

        if (DB::getDriverName() === 'pgsql') {
            $this->replaceStatusCheck(['draft', 'completed', 'cancelled']);
        }
    }

    /**
     * @param  array<int, string>  $statuses
     */
    private function replaceStatusCheck(array $statuses): void
    {
        $values = collect($statuses)->map(fn (string $status) => "'{$status}'::character varying")->implode(', ');

        DB::statement('ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_status_check');
        DB::statement("ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_status_check CHECK (status::text = ANY (ARRAY[{$values}]::text[]))");
    }
};
