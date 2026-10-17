<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academy_public_officials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->string('name');
            $table->string('position');
            $table->string('photo_url', 500)->nullable();
            $table->string('description', 1000)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['akademi_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_public_officials');
    }
};
