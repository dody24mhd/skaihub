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
            $table->string('receipt_number', 30)->nullable()->after('akademi_id');
            $table->unique(['akademi_id', 'receipt_number']);
        });

        $counters = [];

        DB::table('spp_payments')
            ->orderBy('paid_at')
            ->orderBy('id')
            ->get(['id', 'akademi_id', 'paid_at'])
            ->each(function ($payment) use (&$counters) {
                $period = substr(str_replace('-', '', (string) $payment->paid_at), 0, 6);
                $key = $payment->akademi_id.'-'.$period;
                $counters[$key] = ($counters[$key] ?? 0) + 1;

                DB::table('spp_payments')
                    ->where('id', $payment->id)
                    ->update(['receipt_number' => sprintf('KW-%s-%04d', $period, $counters[$key])]);
            });
    }

    public function down(): void
    {
        Schema::table('spp_payments', function (Blueprint $table) {
            $table->dropUnique(['akademi_id', 'receipt_number']);
            $table->dropColumn('receipt_number');
        });
    }
};
