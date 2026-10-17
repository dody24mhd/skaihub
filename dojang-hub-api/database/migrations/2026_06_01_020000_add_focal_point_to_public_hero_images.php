<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academy_public_hero_images', function (Blueprint $table) {
            $table->unsignedTinyInteger('focal_x')->default(50)->after('caption');
            $table->unsignedTinyInteger('focal_y')->default(50)->after('focal_x');
        });
    }

    public function down(): void
    {
        Schema::table('academy_public_hero_images', function (Blueprint $table) {
            $table->dropColumn(['focal_x', 'focal_y']);
        });
    }
};
