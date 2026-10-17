<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\SppPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SppReceiptController extends Controller
{
    public function show(Request $request, SppPayment $sppPayment): JsonResponse
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa melihat kwitansi SPP.'
        );
        abort_unless(
            $sppPayment->akademi_id === $request->user()->akademi_id,
            404,
            'Kwitansi tidak ditemukan.'
        );

        $sppPayment->load(['akademi:id,name,logo_url', 'creator:id,name', 'bill' => fn ($query) => $query->withTrashed()->with([
            'student' => fn ($student) => $student->withTrashed()->with('primaryClass:id,name'),
            'class:id,name',
        ])]);

        $bill = $sppPayment->bill;
        $paidUpToThisPayment = (float) $bill->payments()->where('id', '<=', $sppPayment->id)->sum('amount');
        $remaining = $bill->status === 'waived' ? 0 : max((float) $bill->amount - $paidUpToThisPayment, 0);

        return response()->json([
            'receipt' => [
                'id' => $sppPayment->id,
                'receipt_number' => $sppPayment->receipt_number,
                'akademi' => [
                    'name' => $sppPayment->akademi->name,
                    'logo_url' => $sppPayment->akademi->logo_url,
                ],
                'student' => [
                    'id' => $bill->student->id,
                    'name' => $bill->student->name,
                    'member_number' => $bill->student->member_number,
                    'student_phone' => $bill->student->student_phone,
                    'guardian_name' => $bill->student->guardian_name,
                    'guardian_phone' => $bill->student->guardian_phone,
                ],
                'class_name' => $bill->class?->name ?? $bill->student->primaryClass?->name,
                'billing_year' => $bill->billing_year,
                'billing_month' => $bill->billing_month,
                'amount' => $sppPayment->amount,
                'bill_amount' => $bill->amount,
                'remaining_amount' => number_format($remaining, 2, '.', ''),
                'method' => $sppPayment->method,
                'paid_at' => $sppPayment->paid_at->toDateString(),
                'received_by' => $sppPayment->creator?->name,
                'notes' => $sppPayment->notes,
            ],
        ]);
    }
}
