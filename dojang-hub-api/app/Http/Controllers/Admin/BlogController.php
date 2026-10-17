<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compro\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogController extends Controller
{
    public function index()
    {
        return response()->json(
            BlogPost::orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($data['title']);

        return response()->json(BlogPost::create($data), 201);
    }

    public function show(BlogPost $blog)
    {
        return response()->json($blog);
    }

    public function update(Request $request, BlogPost $blog)
    {
        $data = $this->validatedData($request, $blog->id);
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($data['title'], $blog->id);

        $blog->update($data);

        return response()->json($blog->fresh());
    }

    public function destroy(BlogPost $blog)
    {
        $blog->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request, ?int $blogId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('blog_posts', 'slug')->ignore($blogId),
            ],
            'excerpt' => ['nullable', 'string'],
            'content' => ['required', 'string'],
            'thumbnail_url' => ['nullable', 'url', 'max:500'],
            'category' => ['required', 'string', 'max:100'],
            'author_name' => ['required', 'string', 'max:150'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'og_image_url' => ['nullable', 'url', 'max:500'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    private function uniqueSlug(string $title, ?int $ignoreBlogId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 2;

        while (
            BlogPost::where('slug', $slug)
                ->when($ignoreBlogId, fn ($query) => $query->where('id', '!=', $ignoreBlogId))
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
