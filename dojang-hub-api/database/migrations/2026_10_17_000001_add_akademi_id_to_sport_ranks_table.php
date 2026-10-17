<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sport_ranks', function (Blueprint $table) {
            $table->foreignId('akademi_id')
                ->nullable()
                ->after('id')
                ->constrained('akademi')
                ->cascadeOnDelete();
            $table->index('akademi_id');
        });

        if (DB::getDriverName() === 'sqlite') {
            Schema::table('sport_ranks', function (Blueprint $table) {
                $table->dropUnique(['sport_type', 'code']);
                $table->unique(['akademi_id', 'sport_type', 'code']);
            });
        } else {
            Schema::table('sport_ranks', function (Blueprint $table) {
                $table->dropUnique('sport_ranks_sport_type_code_unique');
                $table->unique(['akademi_id', 'sport_type', 'code'], 'sport_ranks_akademi_sport_code_unique');
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('sport_ranks', function (Blueprint $table) {
                $table->dropUnique(['akademi_id', 'sport_type', 'code']);
                $table->unique(['sport_type', 'code']);
                $table->dropForeign(['akademi_id']);
                $table->dropColumn('akademi_id');
            });
        } else {
            Schema::table('sport_ranks', function (Blueprint $table) {
                $table->dropUnique('sport_ranks_akademi_sport_code_unique');
                $table->unique(['sport_type', 'code'], 'sport_ranks_sport_type_code_unique');
                $table->dropForeign(['akademi_id']);
                $table->dropColumn('akademi_id');
            });
        }
    }
};
