<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compro\Testimonial;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index()
    {
        return response()->json(
            Testimonial::orderBy('sort_order')->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);

        return response()->json(Testimonial::create($data), 201);
    }

    public function show(Testimonial $testimonial)
    {
        return response()->json($testimonial);
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $data = $this->validatedData($request);
        $testimonial->update($data);

        return response()->json($testimonial->fresh());
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request): array
    {
        if (! $request->has('akademi_name') && $request->has('dojang_name')) {
            $request->merge(['akademi_name' => $request->input('dojang_name')]);
        }

        return $request->validate([
            'akademi_name' => ['required', 'string', 'max:255'],
            'person_name' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'quote' => ['required', 'string'],
            'avatar_url' => ['nullable', 'url', 'max:500'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);
    }
}
