<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academy_gallery_items', function (Blueprint $table) {
            $table->boolean('show_on_about')->default(false)->after('caption');
        });

        Schema::create('academy_public_hero_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('image_url', 500);
            $table->string('caption')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['akademi_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_public_hero_images');

        Schema::table('academy_gallery_items', function (Blueprint $table) {
            $table->dropColumn('show_on_about');
        });
    }
};
