<?php

namespace App\Http\Controllers\Compro;

use App\Http\Controllers\Controller;
use App\Models\Compro\Faq;

class FaqController extends Controller
{
    public function index()
    {
        return response()->json(
            Faq::where('is_active', true)
                ->orderBy('sort_order')
                ->orderByDesc('created_at')
                ->get()
        );
    }
}
