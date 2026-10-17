<?php

namespace App\Http\Controllers\Compro;

use App\Http\Controllers\Controller;
use App\Models\Compro\BlogPost;

class BlogController extends Controller
{
    public function index()
    {
        return response()->json(
            BlogPost::where('status', 'published')
                ->orderByDesc('published_at')
                ->get()
        );
    }

    public function show($slug)
    {
        return response()->json(
            BlogPost::where('status', 'published')
                ->where('slug', $slug)
                ->firstOrFail()
        );
    }

    public function incrementView($slug)
    {
        $post = BlogPost::where('status', 'published')
            ->where('slug', $slug)
            ->firstOrFail();

        $post->increment('views_count');

        return response()->json(['success' => true, 'views_count' => $post->views_count]);
    }
}
