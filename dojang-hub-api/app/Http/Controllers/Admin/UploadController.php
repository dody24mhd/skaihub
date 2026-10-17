<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\UploadStorage;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function image(Request $request, UploadStorage $uploads)
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
        ]);

        $path = $uploads->store($request->file('image'), 'uploads/images');

        // Return the full accessible URL
        return response()->json([
            'url' => $uploads->url($path),
        ]);
    }
}
