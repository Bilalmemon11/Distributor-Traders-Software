<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryTransactionController extends Controller
{
    public function index(): JsonResponse
    {
        $transactions = InventoryTransaction::with(['product', 'variant'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
    
    public function print(Request $request)
{
    $query = InventoryTransaction::with(['product', 'variant']);

    if ($request->filled('from')) {
        $query->whereDate('created_at', '>=', $request->from);
    }

    if ($request->filled('to')) {
        $query->whereDate('created_at', '<=', $request->to);
    }

    if ($request->filled('type')) {
        $query->where('type', $request->type);
    }

    if ($request->filled('search')) {

        $search = $request->search;

        $query->whereHas('product', function ($q) use ($search) {

            $q->where('name', 'like', "%{$search}%")
              ->orWhere('sku', 'like', "%{$search}%");

        });
    }

    $transactions = $query
        ->latest()
        ->get();

    $pdf = Pdf::loadView(
        'pdf.stock-history',
        compact('transactions')
    );

    return $pdf->stream('Stock-History.pdf');
}

    public function adjustStock(Request $request)
{
    $request->validate([
        'product_id' => 'required|exists:products,id',
        'variant_id' => 'required|exists:product_variants,id',
        'qty' => 'required|numeric',
    ]);

    DB::transaction(function () use ($request) {

        $variant = ProductVariant::findOrFail($request->variant_id);

        $before = $variant->stock_qty;

        $variant->stock_qty += $request->qty;

        $variant->save();

        InventoryTransaction::create([
            'product_id'    => $request->product_id,
            'variant_id'    => $request->variant_id,
            'type'          => 'adjustment',
            'qty'           => $request->qty,
            'stock_before'  => $before,
            'stock_after'   => $variant->stock_qty,
            'notes'         => 'Manual Stock Adjustment',
        ]);
    });

    return response()->json([
        'success' => true,
        'message' => 'Stock updated successfully.'
    ]);
}


}