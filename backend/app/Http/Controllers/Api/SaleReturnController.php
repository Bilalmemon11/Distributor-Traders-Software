<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SaleReturn;


use App\Models\Invoice;
use App\Models\Product;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\SaleReturnItem;
use App\Models\InventoryTransaction;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\InvoiceItem;
use App\Models\ProductVariant;

class SaleReturnController extends Controller
{
    use ApiResponse;
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
{
$returns = SaleReturn::with([
    'customer',
    'invoice',
    'items.product',
    'items.variant',
])->latest()->get();

    return $this->success($returns);
}
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'invoice_id' => 'required|exists:invoices,id',
        'date' => 'required|date',
        'reason' => 'nullable|string',

        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.product_variant_id' => 'required|exists:product_variants,id',
        'items.*.qty' => 'required|numeric|min:0.01',
    ]);

    try {

        $saleReturn = DB::transaction(function () use ($validated) {


            $invoice = Invoice::with('items')->findOrFail($validated['invoice_id']);

            $lastReturn = SaleReturn::orderBy('id', 'desc')->first();
            $nextNumber = 1;

            if ($lastReturn) {
                if (preg_match('/(\d+)$/', $lastReturn->return_no, $matches)) {
                    $nextNumber = intval($matches[1]) + 1;
                } else {
                    $nextNumber = $lastReturn->id + 1;
                }
            }

            do {
                $returnNo = 'SR-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                $nextNumber++;
            } while (SaleReturn::where('return_no', $returnNo)->exists());

            $grandTotal = 0;

            $saleReturn = SaleReturn::create([
                'return_no'   => $returnNo,
                'invoice_id'  => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'date'        => $validated['date'],
                'reason'      => $validated['reason'] ?? null,
                'total'       => 0,
            ]);

            foreach ($validated['items'] as $item) {

                $invoiceItem = $invoice->items
                  ->where('product_id', $item['product_id'])
                  ->where('product_variant_id', $item['product_variant_id'])
                  ->first();
                if (!$invoiceItem) {
                    throw new \Exception("Product not found in invoice.");
                }

                // Already returned qty
                $returnedQty = SaleReturnItem::whereHas('saleReturn', function ($q) use ($invoice) {
                    $q->where('invoice_id', $invoice->id);
                })
                ->where('product_id', $invoiceItem->product_id)
                ->where('product_variant_id', $invoiceItem->product_variant_id)
                ->sum('qty');

                $remainingQty = $invoiceItem->qty - $returnedQty;

                if ($item['qty'] > $remainingQty) {

                    $product = Product::findOrFail($invoiceItem->product_id);

                    throw new \Exception(
                        "{$product->name}: Only {$remainingQty} item(s) can be returned."
                    );
                }

                $lineTotal = $item['qty'] * $invoiceItem->unit_price;

                $grandTotal += $lineTotal;

SaleReturnItem::create([

    'sale_return_id'=>$saleReturn->id,

    'product_id'=>$invoiceItem->product_id,

    'product_variant_id'=>$invoiceItem->product_variant_id,

    'qty'=>$item['qty'],

    'unit_price'=>$invoiceItem->unit_price,

    'total'=>$lineTotal,

]);                
                // Update invoice item
                $invoiceItem->increment('returned_qty', $item['qty']);
                $invoiceItem->decrement('remaining_qty', $item['qty']);

                // Stock Increase
$variant = ProductVariant::findOrFail(
    $invoiceItem->product_variant_id
);

$before = $variant->stock_qty;

$after = $before + $item['qty'];

$variant->update([
    'stock_qty'=>$after
]);
                // Inventory History
InventoryTransaction::create([

    'product_id'=>$variant->product_id,

    'variant_id'=>$variant->id,

    'type'=>'sale_return',

    'qty'=>$item['qty'],

    'stock_before'=>$before,

    'stock_after'=>$after,

    'notes'=>'Sale Return '.$returnNo,

]);            }

            // Update Sale Return Total
            $saleReturn->update([
                'total' => $grandTotal,
            ]);

            // Customer Ledger
            $customer = Customer::findOrFail($invoice->customer_id);

            $customer->decrement('balance', $grandTotal);
            $customer->decrement('total_purchase', $grandTotal);

            CustomerPayment::create([
            'customer_id' => $customer->id,
            'invoice_id' => $invoice->id,
            'amount' => $grandTotal,
            'date' => $validated['date'],
            'notes' => 'Sale Return ' . $returnNo,
            
            ]);

            // Invoice Balance
            $invoice->balance = max(
                0,
                $invoice->balance - $grandTotal
            );

            $invoice->save();

            return $saleReturn;
        });

        $saleReturn->load([
            'customer',
            'invoice',
            'items.product'
        ]);

        return $this->success(
            $saleReturn,
            'Sale Return Created',
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
public function show(SaleReturn $saleReturn): JsonResponse
{
    $saleReturn->load([
        'customer',
        'invoice',
        'items.product',
        'items.variant'
    ]);

    return response()->json([
        'success' => true,
        'data' => [
            'id' => $saleReturn->id,
            'return_no' => $saleReturn->return_no,
            'invoice_id' => $saleReturn->invoice_id,
            'invoice_no' => optional($saleReturn->invoice)->invoice_no,
            'customer' => [
                'name' => optional($saleReturn->customer)->name,
            ],
            'date' => $saleReturn->date,
            'reason' => $saleReturn->reason,
            'total' => $saleReturn->total,

            'items' => $saleReturn->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,

                    'product' => [
                        'name' => optional($item->product)->name,
                        'variant' => optional($item->variant)->variant_name,

                    ],

                    'qty' => $item->qty,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                ];
            }),
        ]
    ]);
}

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SaleReturn $saleReturn): JsonResponse
{
    try {

        DB::transaction(function () use ($saleReturn) {

            $saleReturn->load('items');

            $customer = Customer::findOrFail($saleReturn->customer_id);

            $invoice = Invoice::find($saleReturn->invoice_id);

            foreach ($saleReturn->items as $item) {

                $variant = ProductVariant::find(
                    $item->product_variant_id
                );

                if ($variant) {
                    $before = $variant->stock_qty;
                    $after = $before - $item->qty;

                    $variant->update([
                        'stock_qty' => $after
                    ]);
                }

                // Delete inventory history of this sale return
                InventoryTransaction::where(
                    'notes',
                    'Sale Return ' . $saleReturn->return_no
                )
                ->where(
                    'variant_id',
                    $item->product_variant_id
                )
                ->delete();

                if ($invoice) {
                    $invoiceItem = InvoiceItem::where('invoice_id', $saleReturn->invoice_id)
                        ->where('product_variant_id', $item->product_variant_id)
                        ->first();

                    if ($invoiceItem) {
                        $invoiceItem->decrement('returned_qty', $item->qty);
                        $invoiceItem->increment('remaining_qty', $item->qty);
                    }
                }
            }

            $customer->increment('balance', $saleReturn->total);

            $customer->increment('total_purchase', $saleReturn->total);

            if ($invoice) {
                $invoice->increment('balance', $saleReturn->total);
            }

            CustomerPayment::where('customer_id', $customer->id)
                ->where('notes', 'Sale Return ' . $saleReturn->return_no)
                ->delete();

            $saleReturn->items()->delete();

            $saleReturn->delete();

        });

        return $this->success(
            null,
            'Sale Return Deleted Successfully'
        );

    } catch (\Exception $e) {

        return $this->error(
            $e->getMessage(),
            500
        );

    }
}

public function print(SaleReturn $saleReturn)
{
    $saleReturn->load([
        'customer',
        'invoice',
        'items.product'
    ]);

    $pdf = Pdf::loadView(
        'pdf.sale-return',
        compact('saleReturn')
    );

    return $pdf->stream(
        'SaleReturn-'.$saleReturn->return_no.'.pdf'
    );
}
}
