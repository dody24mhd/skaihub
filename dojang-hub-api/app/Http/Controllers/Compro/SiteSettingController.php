<?php

namespace App\Http\Controllers\Compro;

use App\Http\Controllers\Controller;
use App\Models\Compro\SiteSetting;

class SiteSettingController extends Controller
{
    public function index()
    {
        return response()->json(
            SiteSetting::orderBy('key')->get()->pluck('value', 'key')
        );
    }
}
