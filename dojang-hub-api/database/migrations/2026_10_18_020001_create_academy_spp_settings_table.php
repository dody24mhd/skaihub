<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academy_spp_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->unique()->constrained('akademi')->cascadeOnDelete();
            $table->decimal('default_monthly_amount', 12, 2)->nullable();
            $table->unsignedTinyInteger('due_day')->default(10);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_spp_settings');
    }
};
