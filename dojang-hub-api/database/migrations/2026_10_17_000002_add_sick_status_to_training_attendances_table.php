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
            DB::statement('ALTER TABLE training_attendances DROP CONSTRAINT IF EXISTS training_attendances_status_check');
            DB::statement("ALTER TABLE training_attendances ADD CONSTRAINT training_attendances_status_check CHECK (status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying, 'excused'::character varying, 'sick'::character varying]::text[]))");
        } else {
            Schema::table('training_attendances', function (Blueprint $table) {
                $table->string('status', 20)->default('absent')->change();
            });
        }
    }

    public function down(): void
    {
        DB::table('training_attendances')
            ->where('status', 'sick')
            ->update(['status' => 'excused']);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE training_attendances DROP CONSTRAINT IF EXISTS training_attendances_status_check');
            DB::statement("ALTER TABLE training_attendances ADD CONSTRAINT training_attendances_status_check CHECK (status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying, 'excused'::character varying]::text[]))");
        } else {
            Schema::table('training_attendances', function (Blueprint $table) {
                $table->string('status', 20)->default('absent')->change();
            });
        }
    }
};
