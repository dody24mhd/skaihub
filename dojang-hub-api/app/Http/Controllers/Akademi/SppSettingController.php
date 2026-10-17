<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\AcademySppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SppSettingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $this->ensureCanManageSpp($request);

        return response()->json([
            'spp_settings' => $this->present(AcademySppSetting::forAkademi($request->user()->akademi_id)),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->ensureCanManageSpp($request);

        $data = $request->validate([
            'default_monthly_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'due_day' => ['required', 'integer', 'between:1,28'],
        ]);

        $setting = AcademySppSetting::updateOrCreate(
            ['akademi_id' => $request->user()->akademi_id],
            [
                'default_monthly_amount' => $data['default_monthly_amount'] ?? null,
                'due_day' => $data['due_day'],
            ],
        );

        return response()->json(['spp_settings' => $this->present($setting->fresh())]);
    }

    private function present(AcademySppSetting $setting): array
    {
        return [
            'default_monthly_amount' => $setting->default_monthly_amount,
            'due_day' => $setting->due_day,
        ];
    }

    private function ensureCanManageSpp(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengatur SPP.'
        );
    }
}
