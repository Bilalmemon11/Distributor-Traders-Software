<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Salesman;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesmanController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $salesmen = Salesman::withCount('invoices')
            ->withSum('invoices as total_sales', 'total')
            ->withSum('invoices as total_commission', 'commission_amount')
            ->orderBy('id')
            ->get();

        return $this->success($salesmen);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|boolean',
        ]);

        $salesman = Salesman::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'commission_rate' => $validated['commission_rate'] ?? 0,
            'status' => $validated['status'] ?? true,
        ]);

        return $this->success($salesman, 'Salesman / Booker created successfully', 201);
    }

    public function show(Salesman $salesman): JsonResponse
    {
        $salesman->load(['invoices' => function ($q) {
            $q->latest()->limit(50);
        }]);

        return $this->success($salesman);
    }

    public function update(Request $request, Salesman $salesman): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|boolean',
        ]);

        $salesman->update($validated);

        return $this->success($salesman->fresh(), 'Salesman / Booker updated successfully');
    }

    public function destroy(Salesman $salesman): JsonResponse
    {
        if ($salesman->invoices()->count() > 0) {
            return $this->error('Cannot delete salesman because invoices are associated with this person.', 422);
        }

        $salesman->delete();

        return $this->success(null, 'Salesman / Booker deleted successfully');
    }
}
