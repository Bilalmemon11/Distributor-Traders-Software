<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeldInvoice;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HeldInvoiceController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $held = HeldInvoice::with('customer')->latest()->get();
        return $this->success($held);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hold_name' => 'nullable|string|max:100',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'total' => 'required|numeric',
            'items_count' => 'required|integer|min:1',
            'invoice_data' => 'required|array',
        ]);

        $held = HeldInvoice::create($validated);

        return $this->success($held, 'Invoice parked / held successfully', 201);
    }

    public function destroy(HeldInvoice $heldInvoice): JsonResponse
    {
        $heldInvoice->delete();
        return $this->success(null, 'Held invoice removed');
    }
}
