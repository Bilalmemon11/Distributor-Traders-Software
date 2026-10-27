<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReturnItem;
use App\Models\Vendor;
use App\Models\VendorPayment;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $purchases = Purchase::with([
            'vendor',
            'items.product',
            'items.variant',
            'returns.items'
        ])
            ->latest()
            ->get()
            ->map(function ($purchase) {

                $items = $purchase->items->map(function ($item) use ($purchase) {

                    $returnedQty = PurchaseReturnItem::whereHas(
                        'purchaseReturn',
                        fn($q) => $q->where('purchase_id', $purchase->id)
                    )
                        ->where('product_id', $item->product_id)
                        ->sum('qty');

                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'product' => $item->product,
                        'variant' => $item->variant,
                        'qty' => $item->qty,
                        'unit_cost' => $item->unit_cost,
                        'total' => $item->total,
                        'returned_qty' => $returnedQty,
                        'remaining_qty' => $item->qty - $returnedQty,
                    ];
                });

                return [
                    ...$purchase->toArray(),
                    'vendor_name' => $purchase->vendor->name,
                    'items' => $items,
                ];
            });

        return $this->success($purchases);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'paid' => 'nullable|numeric|min:0',
        ]);

        try {

            $purchase = DB::transaction(function () use ($validated) {

                $lastPurchase = Purchase::orderBy('id', 'desc')->first();
                $nextNumber = 1;

                if ($lastPurchase) {
                    if (preg_match('/(\d+)$/', $lastPurchase->po_no, $matches)) {
                        $nextNumber = intval($matches[1]) + 1;
                    } else {
                        $nextNumber = $lastPurchase->id + 1;
                    }
                }

                do {
                    $poNo = 'PUR-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                    $nextNumber++;
                } while (Purchase::where('po_no', $poNo)->exists());

                $grandTotal = collect($validated['items'])->sum(
                    fn($i) => $i['qty'] * $i['unit_cost']
                );

                $paid = $validated['paid'] ?? 0;
                $balance = $grandTotal - $paid;

                $purchase = Purchase::create([
                    'po_no' => $poNo,
                    'vendor_id' => $validated['vendor_id'],
                    'date' => $validated['date'],
                    'total' => $grandTotal,
                    'paid' => $paid,
                    'balance' => $balance,
                ]);

                foreach ($validated['items'] as $item) {

                    $product = Product::findOrFail($item['product_id']);

                    $variant = ProductVariant::findOrFail($item['variant_id']);

                    $before = $variant->stock_qty;
                    $after = $before + $item['qty'];

                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'qty' => $item['qty'],
                        'unit_cost' => $item['unit_cost'],
                        'total' => $item['qty'] * $item['unit_cost'],
                    ]);

                    $variant->update([
                        'stock_qty' => $after,
                        'cost_price' => $item['unit_cost'],
                    ]);

                    InventoryTransaction::create([
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'type' => 'purchase',
                        'qty' => $item['qty'],
                        'stock_before' => $before,
                        'stock_after' => $after,
                        'notes' => 'Purchase ' . $poNo,
                    ]);
                }

                $vendor = Vendor::findOrFail($validated['vendor_id']);

                $vendor->increment('balance', $balance);
                $vendor->increment('total_purchase', $grandTotal);

                if ($paid > 0) {
                    VendorPayment::create([
                        'vendor_id' => $vendor->id,
                        'amount' => $paid,
                        'date' => $validated['date'],
                        'notes' => 'Purchase Payment ' . $poNo,
                    ]);
                }

                return $purchase;
            });

            $purchase->load('vendor', 'items.product', 'items.variant');

            return $this->success($purchase, 'Purchase created', 201);

        } catch (\Exception $e) {

            return $this->error(
                'Failed to create purchase: ' . $e->getMessage(),
                500
            );
        }
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $purchase->load('vendor', 'items.product', 'items.variant');

        return $this->success($purchase);
    }

    public function update(Request $request, Purchase $purchase): JsonResponse
    {
        return $this->error(
            'Update function will be converted to variant inventory in next step.',
            501
        );
    }

    public function destroy(Purchase $purchase): JsonResponse
{
    try {

        DB::transaction(function () use ($purchase) {

            $purchase->load('items.product.variants', 'vendor');

            foreach ($purchase->items as $item) {

                $product = $item->product;

                if (!$product) {
                    continue;
                }

                $variant = ProductVariant::find($item->variant_id);

                if (!$variant) {
                    continue;
                }

                $before = $variant->stock_qty;
                $after = $before - $item->qty;

                $variant->update([
                    'stock_qty' => $after
                ]);

                InventoryTransaction::create([
                    'product_id'   => $product->id,
                    'variant_id'   => $variant->id,
                    'type'         => 'purchase_delete',
                    'qty'          => $item->qty,
                    'stock_before' => $before,
                    'stock_after'  => $after,
                    'notes'        => 'Delete Purchase '.$purchase->po_no,
                ]);
            }

            if ($purchase->vendor) {

                $purchase->vendor->decrement(
                    'total_purchase',
                    $purchase->total
                );

                $purchase->vendor->decrement(
                    'balance',
                    $purchase->balance
                );
            }

            VendorPayment::where(
                'notes',
                'Purchase Payment '.$purchase->po_no
            )->delete();

            $purchase->items()->delete();

            $purchase->delete();

        });

        return $this->success(
            null,
            'Purchase deleted successfully.'
        );

    } catch (\Exception $e) {

        return $this->error(
            $e->getMessage(),
            500
        );

    }
}

    public function print(Purchase $purchase)
    {
        $purchase->load([
            'vendor',
            'items.product',
            'items.variant'
        ]);

        $pdf = Pdf::loadView('pdf.purchase', [
            'purchase' => $purchase
        ])->setPaper('a4', 'portrait');

        return $pdf->stream($purchase->po_no . '.pdf');
    }
}
