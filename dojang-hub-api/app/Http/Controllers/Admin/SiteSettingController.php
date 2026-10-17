<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compro\SiteSetting;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    public function index()
    {
        return response()->json(
            SiteSetting::orderBy('key')->get()->pluck('value', 'key')
        );
    }

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'key' => ['required', 'string', 'max:100'],
            'value' => ['required', 'string'],
        ]);

        $setting = SiteSetting::updateOrCreate(
            ['key' => $data['key']],
            ['value' => $data['value']]
        );

        return response()->json($setting);
    }

    public function destroy(string $key)
    {
        $setting = SiteSetting::where('key', $key)->firstOrFail();
        $setting->delete();

        return response()->noContent();
    }
}
