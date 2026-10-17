<?php

namespace App\Http\Controllers\Compro;

use App\Http\Controllers\Controller;
use App\Models\Compro\ContactInquiry;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function store(Request $request)
    {
        if (! $request->has('akademi_name') && $request->has('dojang_name')) {
            $request->merge(['akademi_name' => $request->input('dojang_name')]);
        }

        $data = $request->validate([
            'akademi_name' => 'nullable|string|max:150',
            'person_name' => 'required|string|max:150',
            'phone' => 'required|string|max:30',
            'city' => 'nullable|string|max:100',
            'plan_interest' => 'nullable|in:starter,pro,scale,konsultasi',
            'message' => 'nullable|string',
            'source_page' => 'nullable|string|max:100',
        ]);

        $inquiry = ContactInquiry::create($data);

        return response()->json($inquiry, 201);
    }
}
