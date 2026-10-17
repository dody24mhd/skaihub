<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academy_public_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->unique()->constrained('akademi')->cascadeOnDelete();
            $table->text('about')->nullable();
            $table->string('whatsapp', 30)->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('academy_gallery_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('image_url', 500);
            $table->string('caption', 255)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('akademi_id');
        });

        Schema::create('academy_public_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->date('achieved_on')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('akademi_id');
        });

        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->boolean('show_on_public')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->dropColumn('show_on_public');
        });

        Schema::dropIfExists('academy_public_achievements');
        Schema::dropIfExists('academy_gallery_items');
        Schema::dropIfExists('academy_public_profiles');
    }
};
