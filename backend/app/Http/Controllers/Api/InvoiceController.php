<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\SaleReturn;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\InventoryTransaction;
use App\Models\ProductVariant;
use App\Models\Salesman;

class InvoiceController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
       $invoices = Invoice::with([
    'customer.area',
    'salesman',
    'deliveryMan',
    'items.product',
    'items.variant'

])
->latest()
->get()
->map(function ($invoice) {

    $data = $invoice->toArray();

    $data['customer_name'] = $invoice->customer?->name;
    $data['customer_area'] = $invoice->customer?->area?->name;
    $data['salesman_name'] = $invoice->salesman?->name;
    $data['delivery_man_name'] = $invoice->deliveryMan?->name ?? 'Self / Direct';
    $data['delivery_status'] = $invoice->delivery_status ?? 'delivered';
    $data['delivery_date'] = $invoice->delivery_date ? $invoice->delivery_date->format('Y-m-d') : null;

    $data['items'] = $invoice->items->map(function ($item) {

        return [

            'id' => $item->id,

            'product_id' => $item->product_id,
            'product_variant_id' => $item->product_variant_id,

            'product' => $item->product,
            'variant' => $item->variant,

            'qty' => $item->qty,

            'unit_price' => $item->unit_price,

            'total' => $item->total,

            'returned_qty' => $item->returned_qty,

            'remaining_qty' => $item->remaining_qty,

        ];

    });

    return $data;

});
    return $this->success($invoices);

    }



    // store fun
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([

        'customer_id' => 'required|exists:customers,id',
        'salesman_id' => 'nullable|exists:salesmen,id',
        'delivery_man_id' => 'nullable|exists:delivery_men,id',
        'delivery_status' => 'nullable|in:delivered,dispatched,pending_delivery,returned',
        'delivery_date' => 'nullable|date',
        'delivery_notes' => 'nullable|string|max:500',
        'commission_amount' => 'nullable|numeric|min:0',
        'date' => 'required|date',

        'subtotal' => 'required|numeric',
        'discount' => 'nullable|numeric',
        'total' => 'required|numeric',

        'paid' => 'nullable|numeric',
        'cash_paid' => 'nullable|numeric',
        'online_paid' => 'nullable|numeric',
        'online_method' => 'nullable|string|max:100',
        'payment_notes' => 'nullable|string|max:500',
        'balance' => 'nullable|numeric',
        'allow_exceed_credit_limit' => 'nullable|boolean',

        'payment_type' => 'required|in:cash,credit,split,online',

        'items' => 'required|array|min:1',

        'items.*.product_variant_id' => 'required|exists:product_variants,id',

        'items.*.qty' => 'required|numeric|min:1',

        'items.*.unit_price' => 'required|numeric',

        'items.*.total' => 'required|numeric',

    ]);

    try {

        $invoice = DB::transaction(function () use ($validated) {

            $lastInvoice = Invoice::orderBy('id', 'desc')->first();
            $nextNumber = 1;

            if ($lastInvoice) {
                if (preg_match('/(\d+)$/', $lastInvoice->invoice_no, $matches)) {
                    $nextNumber = intval($matches[1]) + 1;
                } else {
                    $nextNumber = $lastInvoice->id + 1;
                }
            }

            do {
                $invoiceNo = 'INV-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                $nextNumber++;
            } while (Invoice::where('invoice_no', $invoiceNo)->exists());

            $cashPaid = floatval($validated['cash_paid'] ?? 0);
            $onlinePaid = floatval($validated['online_paid'] ?? 0);

            if ($validated['payment_type'] === 'split') {
                $paid = $cashPaid + $onlinePaid;
            } elseif ($validated['payment_type'] === 'online') {
                $paid = $onlinePaid > 0 ? $onlinePaid : floatval($validated['paid'] ?? 0);
                $onlinePaid = $paid;
            } elseif ($validated['payment_type'] === 'cash') {
                $paid = $cashPaid > 0 ? $cashPaid : floatval($validated['paid'] ?? 0);
                $cashPaid = $paid;
            } else {
                $paid = floatval($validated['paid'] ?? 0);
                if ($paid > 0 && $cashPaid == 0 && $onlinePaid == 0) {
                    $cashPaid = $paid;
                }
            }

            $total = floatval($validated['total']);
            $balance = max(0, $total - $paid);

            $salesmanId = $validated['salesman_id'] ?? null;
            $commissionAmount = floatval($validated['commission_amount'] ?? 0);
            if ($salesmanId && $commissionAmount == 0) {
                $salesman = Salesman::find($salesmanId);
                if ($salesman && $salesman->commission_rate > 0) {
                    $commissionAmount = round(($total * floatval($salesman->commission_rate)) / 100, 2);
                }
            }

            $customer = Customer::findOrFail($validated['customer_id']);
            $newBalance = floatval($customer->balance) + $balance;
            if ($customer->credit_limit > 0 && $newBalance > floatval($customer->credit_limit) && empty($validated['allow_exceed_credit_limit'])) {
                $exceeded = $newBalance - floatval($customer->credit_limit);
                throw new \Exception("Customer credit limit exceeded by Rs. " . number_format($exceeded, 2) . "! (Limit: Rs. " . number_format($customer->credit_limit, 2) . ", Current Udhar: Rs. " . number_format($customer->balance, 2) . ", After Bill: Rs. " . number_format($newBalance, 2) . "). Admin approval is required.");
            }

            $invoice = Invoice::create([
                'invoice_no' => $invoiceNo,
                'customer_id' => $validated['customer_id'],
                'salesman_id' => $salesmanId,
                'date' => $validated['date'],
                'subtotal' => $validated['subtotal'],
                'discount' => $validated['discount'] ?? 0,
                'total' => $total,
                'paid' => $paid,
                'cash_paid' => $cashPaid,
                'online_paid' => $onlinePaid,
                'online_method' => $validated['online_method'] ?? null,
                'payment_notes' => $validated['payment_notes'] ?? null,
                'balance' => $balance,
                'commission_amount' => $commissionAmount,
                'payment_type' => $validated['payment_type'],
                'delivery_man_id' => $validated['delivery_man_id'] ?? 1,
                'delivery_status' => $validated['delivery_status'] ?? 'delivered',
                'delivery_date' => $validated['delivery_date'] ?? null,
                'delivery_notes' => $validated['delivery_notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {

                $variant = ProductVariant::findOrFail(
                    $item['product_variant_id']
                );

                if ($variant->stock_qty < $item['qty']) {

                    throw new \Exception(
                        "{$variant->variant_name} stock is insufficient."
                    );
                }

                $before = $variant->stock_qty;

                $after = $before - $item['qty'];

InvoiceItem::create([

    'invoice_id'=>$invoice->id,

    'product_id'=>$variant->product_id,

    'product_variant_id'=>$variant->id,

    'qty'=>$item['qty'],

    'unit_price'=>$item['unit_price'],

    'total'=>$item['total'],

    'returned_qty'=>0,

    'remaining_qty'=>$item['qty']

]);                $variant->update([
                    'stock_qty' => $after
                ]);

                InventoryTransaction::create([

                    'product_id' => $variant->product_id,

                    'variant_id' => $variant->id,

                    'type' => 'sale',

                    'qty' => $item['qty'],

                    'stock_before' => $before,

                    'stock_after' => $after,

                    'notes' => 'Invoice '.$invoiceNo

                ]);
            }

            $customer = Customer::findOrFail(
                $validated['customer_id']
            );

            $customer->increment(
                'balance',
                $balance
            );

            $customer->increment(
                'total_purchase',
                $validated['total']
            );

            if ($paid > 0) {
                $payNote = [];
                if ($cashPaid > 0) $payNote[] = "Cash: Rs " . number_format($cashPaid);
                if ($onlinePaid > 0) {
                    $m = !empty($validated['online_method']) ? $validated['online_method'] : 'Online';
                    $payNote[] = "$m: Rs " . number_format($onlinePaid);
                }
                if (!empty($validated['payment_notes'])) {
                    $payNote[] = "(" . $validated['payment_notes'] . ")";
                }

                CustomerPayment::create([
                    'customer_id' => $customer->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $paid,
                    'date' => $validated['date'],
                    'notes' => count($payNote) > 0 ? implode(', ', $payNote) : 'Invoice payment',
                ]);
            }

            return $invoice;

        });

        $invoice->load([
            'customer',
            'items.product'
        ]);

        return $this->success(
            $invoice,
            'Invoice created',
            201
        );

    } catch (\Exception $e) {

        return $this->error(
            $e->getMessage(),
            500
        );

    }
}


    ///show fun
    public function show(Invoice $invoice): JsonResponse
    {
      $invoice->load([
    'customer',
    'items.product',
    'items.variant'

]);

$data = $invoice->toArray();

$data['items'] = $invoice->items->map(function ($item) {

    return [

        'id' => $item->id,

        'product_id' => $item->product_id,
        'product_variant_id' => $item->product_variant_id,

        'product' => $item->product,
        'variant' => $item->variant,

        'qty' => $item->qty,

        'unit_price' => $item->unit_price,

        'total' => $item->total,

        'returned_qty' => $item->returned_qty,

        'remaining_qty' => $item->remaining_qty,

    ];

});

return $this->success($data);
    }

/// update fun 
public function update(Request $request, Invoice $invoice): JsonResponse
{
    $validated = $request->validate([

        'customer_id' => 'required|exists:customers,id',
        'salesman_id' => 'nullable|exists:salesmen,id',
        'commission_amount' => 'nullable|numeric|min:0',

        'date' => 'required|date',

        'subtotal' => 'required|numeric',

        'discount' => 'nullable|numeric',

        'total' => 'required|numeric',

        'paid' => 'nullable|numeric',
        'cash_paid' => 'nullable|numeric',
        'online_paid' => 'nullable|numeric',
        'online_method' => 'nullable|string|max:100',
        'payment_notes' => 'nullable|string|max:500',
        'balance' => 'nullable|numeric',
        'allow_exceed_credit_limit' => 'nullable|boolean',

        'payment_type' => 'required|in:cash,credit,split,online',

        'items' => 'required|array|min:1',

        'items.*.product_variant_id' => 'required|exists:product_variants,id',

        'items.*.qty' => 'required|numeric|min:1',

        'items.*.unit_price' => 'required|numeric',

        'items.*.total' => 'required|numeric',

    ]);

    try {

        DB::transaction(function () use ($invoice,$validated){

            /*
            -----------------------------
            Rollback Old Stock
            -----------------------------
            */

            foreach($invoice->items as $oldItem){

                if($oldItem->product_variant_id){

                    ProductVariant::where(
                        'id',
                        $oldItem->product_variant_id
                    )->increment(
                        'stock_qty',
                        $oldItem->qty
                    );

                }

            }

            /*
            -----------------------------
            Delete Inventory History
            -----------------------------
            */

            InventoryTransaction::where(
                'notes',
                'Invoice '.$invoice->invoice_no
            )->delete();

            /*
            -----------------------------
            Customer Rollback
            -----------------------------
            */

            $oldCustomer = Customer::find(
                $invoice->customer_id
            );

            $oldCustomer->decrement(
                'balance',
                $invoice->balance
            );

            $oldCustomer->decrement(
                'total_purchase',
                $invoice->total
            );

            /*
            -----------------------------
            Delete Payment
            -----------------------------
            */

            CustomerPayment::where(
                'invoice_id',
                $invoice->id
            )->delete();

            /*
            -----------------------------
            Delete Old Items
            -----------------------------
            */

            $invoice->items()->delete();

            /*
            -----------------------------
            Update Invoice
            -----------------------------
            */

            $cashPaid = floatval($validated['cash_paid'] ?? 0);
            $onlinePaid = floatval($validated['online_paid'] ?? 0);

            if ($validated['payment_type'] === 'split') {
                $paid = $cashPaid + $onlinePaid;
            } elseif ($validated['payment_type'] === 'online') {
                $paid = $onlinePaid > 0 ? $onlinePaid : floatval($validated['paid'] ?? 0);
                $onlinePaid = $paid;
            } elseif ($validated['payment_type'] === 'cash') {
                $paid = $cashPaid > 0 ? $cashPaid : floatval($validated['paid'] ?? 0);
                $cashPaid = $paid;
            } else {
                $paid = floatval($validated['paid'] ?? 0);
                if ($paid > 0 && $cashPaid == 0 && $onlinePaid == 0) {
                    $cashPaid = $paid;
                }
            }

            $total = floatval($validated['total']);
            $balance = max(0, $total - $paid);

            $salesmanId = array_key_exists('salesman_id', $validated) ? $validated['salesman_id'] : $invoice->salesman_id;
            $commissionAmount = floatval($validated['commission_amount'] ?? 0);
            if ($salesmanId && $commissionAmount == 0) {
                $salesman = Salesman::find($salesmanId);
                if ($salesman && $salesman->commission_rate > 0) {
                    $commissionAmount = round(($total * floatval($salesman->commission_rate)) / 100, 2);
                }
            }

            $invoice->update([
                'customer_id'=>$validated['customer_id'],
                'salesman_id'=>$salesmanId,
                'date'=>$validated['date'],
                'subtotal'=>$validated['subtotal'],
                'discount'=>$validated['discount'] ?? 0,
                'total'=>$total,
                'paid'=>$paid,
                'cash_paid'=>$cashPaid,
                'online_paid'=>$onlinePaid,
                'online_method'=>$validated['online_method'] ?? null,
                'payment_notes'=>$validated['payment_notes'] ?? null,
                'balance'=>$balance,
                'commission_amount'=>$commissionAmount,
                'payment_type'=>$validated['payment_type']
            ]);

            /*
            -----------------------------
            Insert New Items
            -----------------------------
            */

            foreach($validated['items'] as $item){

                $variant = ProductVariant::findOrFail(
                    $item['product_variant_id']
                );

                if($variant->stock_qty < $item['qty']){

                    throw new \Exception(
                        $variant->variant_name.
                        ' stock is insufficient.'
                    );

                }

                $before = $variant->stock_qty;

                $after = $before - $item['qty'];

                InvoiceItem::create([

                    'invoice_id'=>$invoice->id,

                    'product_id'=>$variant->product_id,

                    'product_variant_id'=>$variant->id,

                    'qty'=>$item['qty'],

                    'unit_price'=>$item['unit_price'],

                    'total'=>$item['total']

                ]);

                $variant->update([

                    'stock_qty'=>$after

                ]);

                InventoryTransaction::create([

                    'product_id'=>$variant->product_id,

                    'variant_id'=>$variant->id,

                    'type'=>'sale',

                    'qty'=>$item['qty'],

                    'stock_before'=>$before,

                    'stock_after'=>$after,

                    'notes'=>'Invoice '.$invoice->invoice_no

                ]);

            }

            /*
            -----------------------------
            Customer Update
            -----------------------------
            */

            $customer = Customer::findOrFail(
                $validated['customer_id']
            );

            $newBalance = floatval($customer->balance) + $balance;
            if ($customer->credit_limit > 0 && $newBalance > floatval($customer->credit_limit) && empty($validated['allow_exceed_credit_limit'])) {
                $exceeded = $newBalance - floatval($customer->credit_limit);
                throw new \Exception("Customer credit limit exceeded by Rs. " . number_format($exceeded, 2) . "! (Limit: Rs. " . number_format($customer->credit_limit, 2) . ", Current Udhar: Rs. " . number_format($customer->balance, 2) . ", After Bill: Rs. " . number_format($newBalance, 2) . "). Admin approval is required.");
            }

            $customer->increment('balance', $balance);
            $customer->increment('total_purchase', $total);

            /*
            -----------------------------
            Save Payment
            -----------------------------
            */

            if ($paid > 0) {
                $payNote = [];
                if ($cashPaid > 0) $payNote[] = "Cash: Rs " . number_format($cashPaid);
                if ($onlinePaid > 0) {
                    $m = !empty($validated['online_method']) ? $validated['online_method'] : 'Online';
                    $payNote[] = "$m: Rs " . number_format($onlinePaid);
                }
                if (!empty($validated['payment_notes'])) {
                    $payNote[] = "(" . $validated['payment_notes'] . ")";
                }

                CustomerPayment::create([
                    'customer_id' => $customer->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $paid,
                    'date' => $validated['date'],
                    'notes' => count($payNote) > 0 ? implode(', ', $payNote) : 'Invoice payment',
                ]);
            }

        });

        $invoice->load([
            'customer',
            'items.product',
            'items.variant'

        ]);

        return $this->success(
            $invoice,
            'Invoice updated successfully'
        );

    } catch(\Exception $e){

    return response()->json([
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
    ], 500);

    }
}


public function destroy(Invoice $invoice): JsonResponse
{
    try {

        DB::transaction(function () use ($invoice) {

            $invoice->load([
                'items',
                'customer',
                'items.variant'

            ]);

            foreach ($invoice->items as $item) {

                $variant = ProductVariant::find(
                    $item->product_variant_id
                );

                if ($variant) {

                    $before = $variant->stock_qty;

                    $after = $before + $item->qty;

                    $variant->update([
                        'stock_qty' => $after
                    ]);

                    InventoryTransaction::create([
                        'product_id' => $variant->product_id,
                        'variant_id' => $variant->id,
                        'type' => 'sale_delete',
                        'qty' => $item->qty,
                        'stock_before' => $before,
                        'stock_after' => $after,
                        'notes' => 'Delete Invoice '.$invoice->invoice_no
                    ]);
                }
            }

            $invoice->customer->decrement(
                'balance',
                $invoice->balance
            );

            $invoice->customer->decrement(
                'total_purchase',
                $invoice->total
            );

            CustomerPayment::where(
                'invoice_id',
                $invoice->id
            )->delete();

            $invoice->items()->delete();

            $invoice->delete();

        });

        return $this->success(
            null,
            'Invoice deleted successfully.'
        );

    } catch (\Exception $e) {

        return $this->error(
            $e->getMessage(),
            500
        );

    }
}


public function printInvoice(Request $request, Invoice $invoice)
{
    $invoice->load([
        'customer.area',
        'items.product',
        'items.variant',
        'salesman',
        'deliveryMan',
    ]);

    $company = \App\Models\Company::first();
    $size = $request->query('size', $company?->default_invoice_size ?? 'a4');

    if ($size === 'thermal') {
        $pdf = Pdf::loadView('pdf.invoice_thermal', [
            'invoice' => $invoice,
            'company' => $company,
        ])->setPaper([0, 0, 226.77, 1000], 'portrait'); // 80mm width (approx 226.77 points)
    } else {
        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'company' => $company,
        ])->setPaper('a4', 'portrait');
    }

    return $pdf->stream($invoice->invoice_no . '.pdf');
}
}

