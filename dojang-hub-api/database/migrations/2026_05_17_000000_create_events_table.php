<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('excerpt')->nullable();
            $table->longText('description')->nullable();
            $table->string('cover_image_url', 500)->nullable();
            $table->string('location', 180)->nullable();
            $table->string('organizer_name', 150)->nullable();
            $table->string('registration_url', 500)->nullable();
            $table->enum('status', ['draft', 'published', 'cancelled'])->default('draft');
            $table->string('category', 100)->default('Umum');
            $table->boolean('is_featured')->default(false);
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'starts_at']);
            $table->index('is_featured');
        });
    }

    public function down()
    {
        Schema::dropIfExists('events');
    }
};
