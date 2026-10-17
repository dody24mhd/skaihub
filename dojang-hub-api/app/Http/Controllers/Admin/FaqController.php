<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compro\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index()
    {
        return response()->json(
            Faq::orderBy('sort_order')->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);

        return response()->json(Faq::create($data), 201);
    }

    public function show(Faq $faq)
    {
        return response()->json($faq);
    }

    public function update(Request $request, Faq $faq)
    {
        $data = $this->validatedData($request);
        $faq->update($data);

        return response()->json($faq->fresh());
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);
    }
}
