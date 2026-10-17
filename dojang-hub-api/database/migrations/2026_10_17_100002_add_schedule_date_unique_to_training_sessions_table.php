<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const INDEX = 'training_sessions_schedule_source_date_unique';

    public function up(): void
    {
        // Partial unique index: works on pgsql and sqlite; NULL and soft-deleted rows are ignored.
        DB::statement('CREATE UNIQUE INDEX '.self::INDEX.' ON training_sessions (training_schedule_id, source_schedule_date) WHERE training_schedule_id IS NOT NULL AND source_schedule_date IS NOT NULL AND deleted_at IS NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS '.self::INDEX);
    }
};
