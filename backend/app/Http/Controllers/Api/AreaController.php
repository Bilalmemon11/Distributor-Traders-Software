<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $areas = Area::withCount('customers')
            ->orderBy('name')
            ->get();

        return $this->success($areas);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        if (empty($validated['city'])) {
            $validated['city'] = 'Hyderabad';
        }

        $area = Area::create($validated);

        return $this->success($area, 'Area created successfully', 201);
    }

    public function show(Area $area): JsonResponse
    {
        return $this->success($area->load('customers'));
    }

    public function update(Request $request, Area $area): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'city' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $area->update($validated);

        return $this->success($area->fresh(), 'Area updated successfully');
    }

    public function destroy(Area $area): JsonResponse
    {
        if ($area->customers()->count() > 0) {
            return $this->error('Cannot delete area because it is assigned to customers. Please reassign those customers first.', 422);
        }

        $area->delete();

        return $this->success(null, 'Area deleted successfully');
    }
}
