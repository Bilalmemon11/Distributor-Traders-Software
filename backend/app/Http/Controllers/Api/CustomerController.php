<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Invoice;
use App\Models\SaleReturn;

class CustomerController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $customers = Customer::orderBy('name')->get();

        return $this->success($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:1000',
            'type' => 'nullable|in:retail,wholesale',
            'balance' => 'nullable|numeric|min:0',
            'total_purchase' => 'nullable|numeric|min:0',
        ]);

        $customer = Customer::create($validated);

        return $this->success($customer, 'Customer created', 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load('invoices');

        return $this->success($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:1000',
            'type' => 'nullable|in:retail,wholesale',
            'balance' => 'nullable|numeric|min:0',
            'total_purchase' => 'nullable|numeric|min:0',
        ]);

        $customer->update($validated);

        return $this->success($customer->fresh(), 'Customer updated');
    }

    public function destroy(Customer $customer): JsonResponse
    {
        if (\App\Models\Invoice::where('customer_id', $customer->id)->exists()) {
            return $this->error('Cannot delete customer because invoice records exist.', 422);
        }

        if (\App\Models\CustomerPayment::where('customer_id', $customer->id)->exists()) {
            return $this->error('Cannot delete customer because payment records exist.', 422);
        }

        $customer->delete();

        return $this->success(null, 'Customer deleted');
    }

public function receivePayment(Request $request, int $id): JsonResponse
{
    $customer = Customer::findOrFail($id);

    $validated = $request->validate([
        'amount' => 'required|numeric|min:0.01',
        'date' => 'nullable|date',
        'notes' => 'nullable|string|max:500',
        'invoice_id' => 'nullable|exists:invoices,id',
    ]);

    $amount = (float) $validated['amount'];

    if ($amount > $customer->balance) {
        return $this->error('Payment amount exceeds customer balance');
    }

    $customer->decrement('balance', $amount);

    $payment = CustomerPayment::create([
        'customer_id' => $customer->id,
        'invoice_id' => $validated['invoice_id'] ?? null,
        'amount' => $amount,
        'date' => $validated['date'] ?? today(),
        'notes' => $validated['notes'] ?? null,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Payment received successfully.',
        'customer' => $customer->fresh(),
        'payment' => $payment,
    ]);
}
    public function printReceipt(Customer $customer, CustomerPayment $payment)
{
    $payment->load('invoice');

    $pdf = Pdf::loadView('pdf.receipt', [
        'customer' => $customer,
        'payment'  => $payment,
    ]);

    return $pdf->stream(
        'receipt'.$payment->id.'.pdf'
    );
}


// public function ledger(Customer $customer)
// {
//     $customer->load([
//         'payments',
//         'invoices',
//         'saleReturns'

//     ]);

//     $totalPurchase = $customer->total_purchase;

//     $totalReceived = $customer->payments->sum('amount');

//     $remainingBalance = $customer->balance;

//     $totalReturns = $customer->saleReturns->sum('total');

//     $pdf = Pdf::loadView('pdf.customer-ledger', [
//         'customer'          => $customer,
//         'totalPurchase'     => $totalPurchase,
//         'totalReceived'     => $totalReceived,
//         'totalReturns'     => $totalReturns,
//         'remainingBalance'  => $remainingBalance,
//     ]);

//     return $pdf->stream(
//         'Ledger-' . $customer->name . '.pdf'
//     );
// }
public function ledger(Customer $customer)
{
    $customer->load([
        'payments.invoice',
        'invoices',
    ]);

    $saleReturns = SaleReturn::with('invoice')
        ->where('customer_id', $customer->id)
        ->latest()
        ->get();

    $totalPurchase = $customer->total_purchase;

    $totalReceived = $customer->payments->sum('amount');

    $remainingBalance = $customer->balance;

    $pdf = Pdf::loadView('pdf.customer-ledger', [

        'customer' => $customer,

        'saleReturns' => $saleReturns,

        'totalPurchase' => $totalPurchase,

        'totalReceived' => $totalReceived,

        'remainingBalance' => $remainingBalance,

    ]);

    return $pdf->stream(
        'Ledger-'.str_replace(['/', '\\'], '-', $customer->name).'.pdf'
    );
}

public function paymentHistory(Customer $customer)
{
    $payments = $customer
        ->payments()
        ->latest()
        ->with('invoice')
        ->get();

    return $this->success($payments);
}

}
