<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compro\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    public function index()
    {
        return response()->json(
            Event::orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($data['title']);

        return response()->json(Event::create($data), 201);
    }

    public function show(Event $event)
    {
        return response()->json($event);
    }

    public function update(Request $request, Event $event)
    {
        $data = $this->validatedData($request, $event->id);
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($data['title'], $event->id);

        $event->update($data);

        return response()->json($event->fresh());
    }

    public function destroy(Event $event)
    {
        $event->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request, ?int $eventId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('events', 'slug')->ignore($eventId),
            ],
            'excerpt' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'cover_image_url' => ['nullable', 'url', 'max:500'],
            'location' => ['nullable', 'string', 'max:180'],
            'organizer_name' => ['nullable', 'string', 'max:150'],
            'registration_url' => ['nullable', 'url', 'max:500'],
            'status' => ['required', Rule::in(['draft', 'published', 'cancelled'])],
            'category' => ['nullable', 'string', 'max:100'],
            'is_featured' => ['boolean'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    private function uniqueSlug(string $title, ?int $ignoreEventId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 2;

        while (
            Event::where('slug', $slug)
                ->when($ignoreEventId, fn ($query) => $query->where('id', '!=', $ignoreEventId))
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
