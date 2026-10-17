<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('akademi', function (Blueprint $table) {
            $table->string('rank_system', 50)->nullable()->after('sport_type');
        });

        Schema::table('sport_ranks', function (Blueprint $table) {
            $table->string('rank_system', 50)->nullable()->after('sport_type');
            $table->string('level_type', 10)->nullable()->after('sequence');
            $table->unsignedSmallInteger('level_number')->nullable()->after('level_type');
            $table->string('belt_color', 20)->nullable()->after('level_number');
            $table->string('stripe_color', 20)->nullable()->after('belt_color');
            $table->index(['rank_system', 'akademi_id']);
        });

        DB::table('akademi')->where('sport_type', 'taekwondo')->update(['rank_system' => 'taekwondo_kukkiwon']);
        DB::table('akademi')->where('sport_type', 'karate')->update(['rank_system' => 'karate_forki']);

        DB::table('sport_ranks')->whereNull('akademi_id')->where('sport_type', 'taekwondo')
            ->update(['rank_system' => 'taekwondo_kukkiwon']);
        DB::table('sport_ranks')->whereNull('akademi_id')->where('sport_type', 'karate')
            ->update(['rank_system' => 'karate_forki']);

        DB::table('sport_ranks')->whereNotNull('akademi_id')->update([
            'rank_system' => DB::raw('(SELECT akademi.rank_system FROM akademi WHERE akademi.id = sport_ranks.akademi_id)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('sport_ranks', function (Blueprint $table) {
            $table->dropIndex(['rank_system', 'akademi_id']);
            $table->dropColumn(['rank_system', 'level_type', 'level_number', 'belt_color', 'stripe_color']);
        });

        Schema::table('akademi', function (Blueprint $table) {
            $table->dropColumn('rank_system');
        });
    }
};
