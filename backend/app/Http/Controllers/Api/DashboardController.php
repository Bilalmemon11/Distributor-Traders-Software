<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Vendor;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $totalSales = Invoice::sum('total');
        $cashCollected = Invoice::sum('paid');
        $customerUdhar = Customer::sum('balance');
        $vendorPayable = Vendor::sum('balance');
        $totalExpenses = Expense::sum('amount');

        $totalCogs = \Illuminate\Support\Facades\DB::table('invoice_items')
            ->join('product_variants', 'invoice_items.product_variant_id', '=', 'product_variants.id')
            ->sum(\Illuminate\Support\Facades\DB::raw('invoice_items.qty * product_variants.cost_price'));
        $totalProfit = $totalSales - $totalCogs - $totalExpenses;

        $company = \App\Models\Company::first();
        $lowStockThreshold = $company?->low_stock_threshold ?? 10;
        $expiryAlertDays = $company?->expiry_alert_days ?? 60;

        $lowStockVariants = \App\Models\ProductVariant::with('product')
            ->where(function ($q) use ($lowStockThreshold) {
                $q->whereColumn('stock_qty', '<=', 'reorder_level')
                  ->orWhere('stock_qty', '<=', $lowStockThreshold);
            })
            ->get()
            ->map(fn($v) => [
                'id' => $v->id,
                'name' => ($v->product ? $v->product->name : '') . ' - ' . $v->variant_name,
                'category' => ($v->product && $v->product->category) ? $v->product->category->name : '',
                'stock_qty' => $v->stock_qty,
                'unit' => ($v->product && $v->product->unit) ? $v->product->unit->name : '',
                'reorder_level' => $v->reorder_level,
            ]);

        $todaysInvoices = Invoice::with('customer')
            ->whereDate('date', today())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'invoice_no' => $inv->invoice_no,
                'customer_name' => $inv->customer->name,
                'total' => $inv->total,
                'paid' => $inv->paid,
                'balance' => $inv->balance,
                'payment_type' => $inv->payment_type,
            ]);

        $recentInvoices = Invoice::with('customer')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'invoice_no' => $inv->invoice_no,
                'customer_name' => $inv->customer->name,
                'date' => $inv->date->format('Y-m-d'),
                'total' => $inv->total,
                'payment_type' => $inv->payment_type,
            ]);

        $vendorDues = Vendor::where('balance', '>', 0)
            ->orderByDesc('balance')
            ->get(['id', 'name', 'city', 'balance']);

        $customerDues = Customer::where('balance', '>', 0)
            ->orderByDesc('balance')
            ->get(['id', 'name', 'type', 'balance']);

        $expenseByCategory = Expense::selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $today = now()->startOfDay();
        $expiryWindow = now()->addDays($expiryAlertDays)->endOfDay();

        $expiredCount = \App\Models\ProductVariant::whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', $today)
            ->where('stock_qty', '>', 0)
            ->count();

        $expiringSoonCount = \App\Models\ProductVariant::whereNotNull('expiry_date')
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', $expiryWindow)
            ->where('stock_qty', '>', 0)
            ->count();

        return $this->success([
            'total_sales' => (float) $totalSales,
            'cash_collected' => (float) $cashCollected,
            'customer_udhar' => (float) $customerUdhar,
            'vendor_payable' => (float) $vendorPayable,
            'total_expenses' => (float) $totalExpenses,
            'total_profit' => (float) $totalProfit,
            'low_stock_products' => $lowStockVariants,
            'todays_invoices' => $todaysInvoices,
            'recent_invoices' => $recentInvoices,
            'vendor_dues' => $vendorDues,
            'customer_dues' => $customerDues,
            'expense_by_category' => $expenseByCategory,
            'expired_count' => $expiredCount,
            'expiring_soon_count' => $expiringSoonCount,
        ]);
    }
}
