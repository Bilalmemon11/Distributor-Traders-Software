<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $expenses = Expense::latest()->get();

        return $this->success($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
        ]);

        $expense = Expense::create($validated);

        return $this->success($expense, 'Expense created', 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return $this->success($expense);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'sometimes|required|date',
            'category' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
        ]);

        $expense->update($validated);

        return $this->success($expense->fresh(), 'Expense updated');
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return $this->success(null, 'Expense deleted');
    }
}
