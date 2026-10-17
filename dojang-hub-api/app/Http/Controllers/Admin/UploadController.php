<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function image(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
        ]);

        $path = $request->file('image')->store('uploads/images', 'public');

        // Return the full accessible URL
        return response()->json([
            'url' => asset(Storage::url($path)),
        ]);
    }
}
