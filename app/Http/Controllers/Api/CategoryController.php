<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cats = Category::orderBy('name')->get();

        return response()->json([
            'categories' => $cats->map(fn ($c) => $this->serialize($c)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parentId' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $category = Category::create([
            'organization_id' => $request->user()->organization_id,
            'name' => $data['name'],
            'parent_id' => $data['parentId'] ?? null,
        ]);

        return response()->json($this->serialize($category), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'parentId' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $category->update([
            'name' => $data['name'] ?? $category->name,
            'parent_id' => array_key_exists('parentId', $data) ? $data['parentId'] : $category->parent_id,
        ]);

        return response()->json($this->serialize($category));
    }

    public function destroy(int $id): JsonResponse
    {
        Category::findOrFail($id)->delete();

        return response()->json(['ok' => true]);
    }

    private function serialize(Category $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'parentId' => $c->parent_id,
        ];
    }
}
