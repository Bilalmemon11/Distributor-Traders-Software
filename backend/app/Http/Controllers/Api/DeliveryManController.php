<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryMan;
use App\Models\Invoice;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryManController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $deliveryMen = DeliveryMan::withCount([
            'invoices',
            'invoices as pending_deliveries_count' => function ($q) {
                $q->whereIn('delivery_status', ['pending_delivery', 'dispatched']);
            },
            'invoices as completed_deliveries_count' => function ($q) {
                $q->where('delivery_status', 'delivered');
            }
        ])
        ->withSum('invoices as total_delivered_amount', 'total')
        ->orderBy('id')
        ->get();

        return $this->success($deliveryMen);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'vehicle_no' => 'nullable|string|max:100',
            'status' => 'nullable|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $deliveryMan = DeliveryMan::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'vehicle_no' => $validated['vehicle_no'] ?? null,
            'status' => $validated['status'] ?? true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->success($deliveryMan, 'Supply / Delivery Man added successfully', 201);
    }

    public function show(DeliveryMan $deliveryMan): JsonResponse
    {
        $deliveryMan->load(['invoices' => function ($q) {
            $q->with('customer.area')->latest()->limit(50);
        }]);

        return $this->success($deliveryMan);
    }

    public function update(Request $request, DeliveryMan $deliveryMan): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'vehicle_no' => 'nullable|string|max:100',
            'status' => 'nullable|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $deliveryMan->update($validated);

        return $this->success($deliveryMan->fresh(), 'Supply / Delivery Man updated successfully');
    }

    public function destroy(DeliveryMan $deliveryMan): JsonResponse
    {
        if ($deliveryMan->id === 1) {
            return $this->error('Cannot delete default Self / Direct delivery staff.', 422);
        }

        if ($deliveryMan->invoices()->count() > 0) {
            return $this->error('Cannot delete because invoices/deliveries are assigned to this supply man.', 422);
        }

        $deliveryMan->delete();

        return $this->success(null, 'Supply / Delivery Man deleted successfully');
    }

    /**
     * Get Daily Dispatch / Delivery Sheet
     */
    public function dispatchSheet(Request $request): JsonResponse
    {
        $query = Invoice::with(['customer.area', 'salesman', 'deliveryMan', 'items.product', 'items.variant'])
            ->latest('date');

        if ($request->filled('delivery_man_id') && $request->delivery_man_id !== 'all') {
            $query->where('delivery_man_id', $request->delivery_man_id);
        }

        if ($request->filled('delivery_status') && $request->delivery_status !== 'all') {
            $query->where('delivery_status', $request->delivery_status);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        if ($request->filled('area_id') && $request->area_id !== 'all') {
            $query->whereHas('customer', function ($q) use ($request) {
                $q->where('area_id', $request->area_id);
            });
        }

        $invoices = $query->get()->map(function ($inv) {
            return [
                'id' => $inv->id,
                'invoice_no' => $inv->invoice_no,
                'date' => $inv->date ? $inv->date->format('Y-m-d') : null,
                'customer_id' => $inv->customer_id,
                'customer_name' => $inv->customer?->name,
                'customer_phone' => $inv->customer?->phone,
                'customer_address' => $inv->customer?->address,
                'customer_area' => $inv->customer?->area?->name ?? 'Unassigned Area',
                'salesman_name' => $inv->salesman?->name ?? 'Self / Admin',
                'delivery_man_id' => $inv->delivery_man_id,
                'delivery_man_name' => $inv->deliveryMan?->name ?? 'Self / Direct',
                'vehicle_no' => $inv->deliveryMan?->vehicle_no,
                'total' => (float) $inv->total,
                'paid' => (float) $inv->paid,
                'balance' => (float) $inv->balance,
                'payment_type' => $inv->payment_type,
                'delivery_status' => $inv->delivery_status ?? 'delivered',
                'delivery_date' => $inv->delivery_date ? $inv->delivery_date->format('Y-m-d') : null,
                'delivery_notes' => $inv->delivery_notes,
                'total_items_qty' => $inv->items->sum('qty'),
            ];
        });

        $summary = [
            'total_invoices' => $invoices->count(),
            'total_value' => $invoices->sum('total'),
            'total_cash_to_collect' => $invoices->sum('balance'),
            'pending_delivery_count' => $invoices->whereIn('delivery_status', ['pending_delivery', 'dispatched'])->count(),
            'delivered_count' => $invoices->where('delivery_status', 'delivered')->count(),
        ];

        return $this->success([
            'invoices' => $invoices,
            'summary' => $summary,
        ]);
    }

    /**
     * Quick status / assignment update for an invoice
     */
    public function updateInvoiceDelivery(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'delivery_man_id' => 'nullable|exists:delivery_men,id',
            'delivery_status' => 'required|in:delivered,dispatched,pending_delivery,returned',
            'delivery_date' => 'nullable|date',
            'delivery_notes' => 'nullable|string|max:500',
        ]);

        $invoice->update([
            'delivery_man_id' => $validated['delivery_man_id'] ?? $invoice->delivery_man_id,
            'delivery_status' => $validated['delivery_status'],
            'delivery_date' => $validated['delivery_date'] ?? ($validated['delivery_status'] === 'delivered' ? now() : $invoice->delivery_date),
            'delivery_notes' => $validated['delivery_notes'] ?? $invoice->delivery_notes,
        ]);

        return $this->success($invoice->load(['deliveryMan', 'customer.area']), 'Delivery status updated successfully');
    }
}
