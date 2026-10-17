<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compro\ContactInquiry;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function index()
    {
        return response()->json(
            ContactInquiry::orderBy('is_followed_up')
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function show(ContactInquiry $inquiry)
    {
        return response()->json($inquiry);
    }

    public function update(Request $request, ContactInquiry $inquiry)
    {
        $data = $request->validate([
            'is_followed_up' => ['required', 'boolean'],
        ]);

        $inquiry->update($data);

        return response()->json($inquiry->fresh());
    }

    public function destroy(ContactInquiry $inquiry)
    {
        $inquiry->delete();

        return response()->noContent();
    }
}
