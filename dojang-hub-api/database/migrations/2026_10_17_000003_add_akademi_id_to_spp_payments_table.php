<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spp_payments', function (Blueprint $table) {
            $table->foreignId('akademi_id')
                ->nullable()
                ->after('id')
                ->constrained('akademi')
                ->cascadeOnDelete();
            $table->index(['akademi_id', 'paid_at']);
        });

        DB::statement('UPDATE spp_payments SET akademi_id = (SELECT akademi_id FROM spp_bills WHERE spp_bills.id = spp_payments.spp_bill_id) WHERE akademi_id IS NULL');
    }

    public function down(): void
    {
        Schema::table('spp_payments', function (Blueprint $table) {
            $table->dropIndex(['akademi_id', 'paid_at']);
            $table->dropForeign(['akademi_id']);
            $table->dropColumn('akademi_id');
        });
    }
};
