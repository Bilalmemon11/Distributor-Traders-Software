<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;

use App\Models\Product;
use App\Models\Vendor;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\InventoryTransaction;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseReturnController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
{
    $returns = PurchaseReturn::with([
        'vendor',
        'purchase',
        'items.product'
        
    ])
    ->latest()
    ->get();

    return $this->success($returns);
}
    /**
     * Store a newly created resource in storage.
     */
  public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'purchase_id' => 'required|exists:purchases,id',
        'date' => 'required|date',
        'reason' => 'nullable|string',

        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.variant_id' => 'required|exists:product_variants,id',
        'items.*.qty' => 'required|numeric|min:0.01',
    ]);

    try {

        $purchaseReturn = DB::transaction(function () use ($validated) {

            $purchase = Purchase::with('items.product')->findOrFail($validated['purchase_id']);

            $lastReturn = PurchaseReturn::orderBy('id', 'desc')->first();
            $nextNumber = 1;

            if ($lastReturn) {
                if (preg_match('/(\d+)$/', $lastReturn->return_no, $matches)) {
                    $nextNumber = intval($matches[1]) + 1;
                } else {
                    $nextNumber = $lastReturn->id + 1;
                }
            }

            do {
                $returnNo = 'PR-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                $nextNumber++;
            } while (PurchaseReturn::where('return_no', $returnNo)->exists());

            $grandTotal = 0;

            $purchaseReturn = PurchaseReturn::create([
                'return_no'   => $returnNo,
                'purchase_id' => $purchase->id,
                'vendor_id'   => $purchase->vendor_id,
                'date'        => $validated['date'],
                'reason'      => $validated['reason'] ?? null,
                'total'       => 0,
            ]);

            foreach ($validated['items'] as $item) {

                $purchaseItem = $purchase->items
                    ->where('product_id', $item['product_id'])
                    ->where('variant_id', $item['variant_id'])
                    ->first();

                if (!$purchaseItem) {
                    throw new \Exception("Product variant not found in purchase.");
                }

                $product = Product::findOrFail($purchaseItem->product_id);
                $variant = \App\Models\ProductVariant::findOrFail($item['variant_id']);

                /*
                ---------------------------------
                Already Returned Qty
                ---------------------------------
                */

                $returnedQty = PurchaseReturnItem::whereHas(
                    'purchaseReturn',
                    function ($q) use ($purchase) {
                        $q->where('purchase_id', $purchase->id);
                    }
                )
                ->where('variant_id', $item['variant_id'])
                ->sum('qty');

                $remainingQty = $purchaseItem->qty - $returnedQty;

                if ($item['qty'] > $remainingQty) {
                    throw new \Exception(
                        "{$product->name} : Only {$remainingQty} item(s) remaining for return."
                    );
                }

                /*
                ---------------------------------
                Return Item
                ---------------------------------
                */

                $lineTotal = $item['qty'] * $purchaseItem->unit_cost;
                $grandTotal += $lineTotal;

                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'product_id'         => $purchaseItem->product_id,
                    'variant_id'         => $item['variant_id'],
                    'qty'                => $item['qty'],
                    'unit_cost'          => $purchaseItem->unit_cost,
                    'total'              => $lineTotal,
                ]);

                /*
                ---------------------------------
                Reduce Stock
                ---------------------------------
                */

                $before = $variant->stock_qty;
                $after  = $before - $item['qty'];

                $variant->update([
                    'stock_qty' => $after,
                ]);

                /*
                ---------------------------------
                Inventory History
                ---------------------------------
                */

                InventoryTransaction::create([
                    'product_id'   => $product->id,
                    'variant_id'   => $variant->id,
                    'type'         => 'purchase_return',
                    'qty'          => $item['qty'],
                    'stock_before' => $before,
                    'stock_after'  => $after,
                    'notes'        => 'Purchase Return '.$returnNo.' | '.$purchase->po_no,
                ]);

            }

            /*
            ---------------------------------
            Update Return Total
            ---------------------------------
            */

            $purchaseReturn->update([
                'total' => $grandTotal,
            ]);

            /*
            ---------------------------------
            Update Vendor
            ---------------------------------
            */

            $vendor = Vendor::findOrFail($purchase->vendor_id);

            $vendor->decrement('balance', $grandTotal);
            $vendor->decrement('total_purchase', $grandTotal);

            return $purchaseReturn;

        });

        $purchaseReturn->load([
            'vendor',
            'purchase',
            'items.product',
        ]);

        return $this->success(
            $purchaseReturn,
            'Purchase Return Created',
            201
        );

    } catch (\Exception $e) {

        return $this->error(
            $e->getMessage(),
            500
        );

    }
}

    /**
     * Display the specified resource.
     */
public function show(PurchaseReturn $purchaseReturn): JsonResponse
{

    $purchaseReturn->load(

        'vendor',

        'purchase',

        'items.product'

    );

    return $this->success(

        $purchaseReturn

    );

}

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

public function print(PurchaseReturn $purchaseReturn)
{
    $purchaseReturn->load([
        'vendor',
        'purchase',
        'items.product'
    ]);

    $pdf = Pdf::loadView(
        'pdf.purchase-return',
        [
            'purchaseReturn' => $purchaseReturn
        ]
    );

    return $pdf->stream(
        'Purchase-Return-' .
        $purchaseReturn->return_no .
        '.pdf'
    );
}

    /**
     * Remove the specified resource from storage.
     */
     public function destroy(PurchaseReturn $purchaseReturn): JsonResponse
{

try{

DB::transaction(function()use($purchaseReturn){

$purchaseReturn->load(
'items.product',
'items.variant',
'vendor'
);

foreach($purchaseReturn->items as $item){

$variant=$item->variant;

if ($variant) {
    $before=$variant->stock_qty;
    $after=$before+$item->qty;

    $variant->update([
    'stock_qty'=>$after
    ]);

    InventoryTransaction::create([
    'product_id'=>$item->product_id,
    'variant_id'=>$variant->id,
    'type'=>'purchase_return_delete',
    'qty'=>$item->qty,
    'stock_before'=>$before,
    'stock_after'=>$after,
    'notes'=>'Delete '.$purchaseReturn->return_no
    ]);
}
}

$vendor=

$purchaseReturn->vendor;

$vendor->increment(

'balance',

$purchaseReturn->total

);

$vendor->increment(

'total_purchase',

$purchaseReturn->total

);

$purchaseReturn

->items()

->delete();

$purchaseReturn

->delete();

});

return $this->success(

null,

'Purchase Return Deleted'

);

}catch(\Exception $e){

return $this->error(

$e->getMessage(),

500

);

}

}
}
