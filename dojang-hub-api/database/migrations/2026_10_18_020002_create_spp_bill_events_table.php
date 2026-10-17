<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spp_bill_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akademi_id')->constrained('akademi')->cascadeOnDelete();
            $table->foreignId('spp_bill_id')->constrained('spp_bills')->cascadeOnDelete();
            $table->enum('type', ['created', 'payment', 'waived', 'payment_voided']);
            $table->decimal('amount', 12, 2)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['akademi_id', 'spp_bill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spp_bill_events');
    }
};
