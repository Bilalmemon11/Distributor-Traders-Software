<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->success(
            ExpenseCategory::orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|unique:expense_categories,name'
        ]);

        $category = ExpenseCategory::create($validated);

        return $this->success(
            $category,
            'Expense Category created successfully.',
            201
        );
    }
}