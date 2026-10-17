<?php

namespace App\Http\Controllers\Compro;

use App\Http\Controllers\Controller;
use App\Models\Compro\Event;

class EventController extends Controller
{
    public function index()
    {
        return response()->json(
            Event::where('status', 'published')
                ->orderByDesc('is_featured')
                ->orderBy('starts_at')
                ->get()
        );
    }

    public function show($slug)
    {
        return response()->json(
            Event::where('status', 'published')
                ->where('slug', $slug)
                ->firstOrFail()
        );
    }

    public function incrementView($slug)
    {
        $event = Event::where('status', 'published')
            ->where('slug', $slug)
            ->firstOrFail();

        $event->increment('views_count');

        return response()->json(['success' => true, 'views_count' => $event->views_count]);
    }
}
