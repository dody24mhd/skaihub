<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('akademi_name', 150);
            $table->string('person_name', 150);
            $table->string('city', 100)->nullable();
            $table->text('quote');
            $table->string('avatar_url', 500)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->text('answer');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('thumbnail_url', 500)->nullable();
            $table->string('category', 100)->nullable();
            $table->string('author_name', 150)->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->string('meta_title', 255)->nullable();
            $table->text('meta_description')->nullable();
            $table->string('og_image_url', 500)->nullable();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('contact_inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('akademi_name', 150)->nullable();
            $table->string('person_name', 150);
            $table->string('phone', 30);
            $table->string('city', 100)->nullable();
            $table->enum('plan_interest', ['starter', 'pro', 'scale', 'konsultasi'])->nullable();
            $table->text('message')->nullable();
            $table->string('source_page', 100)->nullable();
            $table->boolean('is_followed_up')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('contact_inquiries');
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('testimonials');
    }
};
