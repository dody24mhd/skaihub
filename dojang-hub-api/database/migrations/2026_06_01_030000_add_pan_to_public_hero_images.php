<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academy_public_hero_images', function (Blueprint $table) {
            $table->smallInteger('pan_x')->default(0)->after('focal_y');
            $table->smallInteger('pan_y')->default(0)->after('pan_x');
            $table->unsignedSmallInteger('zoom')->default(100)->after('pan_y');
        });
    }

    public function down(): void
    {
        Schema::table('academy_public_hero_images', function (Blueprint $table) {
            $table->dropColumn(['pan_x', 'pan_y', 'zoom']);
        });
    }
};
