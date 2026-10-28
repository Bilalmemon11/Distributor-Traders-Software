<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\SaleReturn;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ApiResponse;

    public function profitLoss(Request $request): JsonResponse
    {
        $from = $request->from_date;
        $to = $request->to_date;

        $invoiceQuery = Invoice::query();
        $expenseQuery = Expense::query();
        $returnQuery = SaleReturn::query();
        $invoiceItemQuery = InvoiceItem::query();

        if ($from) {
            $invoiceQuery->whereDate('date', '>=', $from);
            $expenseQuery->whereDate('date', '>=', $from);
            $returnQuery->whereDate('date', '>=', $from);

            $invoiceItemQuery->whereHas('invoice', function ($q) use ($from) {
                $q->whereDate('date', '>=', $from);
            });
        }

        if ($to) {
            $invoiceQuery->whereDate('date', '<=', $to);
            $expenseQuery->whereDate('date', '<=', $to);
            $returnQuery->whereDate('date', '<=', $to);

            $invoiceItemQuery->whereHas('invoice', function ($q) use ($to) {
                $q->whereDate('date', '<=', $to);
            });
        }

        $grossRevenue = (float) $invoiceQuery->sum('total');
        $totalDiscount = (float) $invoiceQuery->sum('discount');
        $totalSubtotal = (float) $invoiceQuery->sum('subtotal');
        $totalSalesmanCommission = (float) $invoiceQuery->sum('commission_amount');
        $totalCashOnInvoices = (float) $invoiceQuery->sum('paid');

        $totalReturns = (float) $returnQuery->sum('total');
        $totalRevenue = max(0, $grossRevenue - $totalReturns);

        $totalCogs = (float) (clone $invoiceItemQuery)
            ->join('product_variants', 'invoice_items.product_variant_id', '=', 'product_variants.id')
            ->selectRaw('SUM((invoice_items.qty - COALESCE(invoice_items.returned_qty, 0)) * product_variants.cost_price) as cogs')
            ->value('cogs') ?? 0;

        $grossProfit = $totalRevenue - $totalCogs;
        $totalExpenses = (float) $expenseQuery->sum('amount');

        // Damaged stock loss
        $damageQuery = DB::table('inventory_transactions')
            ->join('product_variants', 'inventory_transactions.variant_id', '=', 'product_variants.id')
            ->where('inventory_transactions.type', 'damage');
        if ($from) $damageQuery->whereDate('inventory_transactions.created_at', '>=', $from);
        if ($to) $damageQuery->whereDate('inventory_transactions.created_at', '<=', $to);
        $totalDamageLoss = (float) ($damageQuery->selectRaw('SUM(ABS(inventory_transactions.qty) * product_variants.cost_price) as loss')->value('loss') ?? 0);

        // Net profit
        $netProfit = $grossProfit - $totalExpenses - $totalSalesmanCommission - $totalDamageLoss;

        // Cash collections in period
        $custPaymentsQuery = DB::table('customer_payments');
        if ($from) $custPaymentsQuery->whereDate('date', '>=', $from);
        if ($to) $custPaymentsQuery->whereDate('date', '<=', $to);
        $totalCustomerRecovery = (float) $custPaymentsQuery->sum('amount');
        $totalCashCollected = $totalCashOnInvoices + $totalCustomerRecovery;
        $cashInHandProfit = $totalCashCollected - $totalExpenses - $totalSalesmanCommission;

        $grossMarginPct = $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0;
        $netMarginPct = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0;
        $expenseRatioPct = $totalRevenue > 0 ? round(($totalExpenses / $totalRevenue) * 100, 2) : 0;
        $cogsRatioPct = $totalRevenue > 0 ? round(($totalCogs / $totalRevenue) * 100, 2) : 0;

        $expenseBreakdown = $expenseQuery
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        // Top 5 Most Profitable Products
        $topProfitableProducts = (clone $invoiceItemQuery)
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->join('product_variants', 'invoice_items.product_variant_id', '=', 'product_variants.id')
            ->select(
                'products.name as product_name',
                'product_variants.variant_name',
                DB::raw('SUM(invoice_items.qty - COALESCE(invoice_items.returned_qty, 0)) as total_qty'),
                DB::raw('SUM(invoice_items.total) as total_revenue'),
                DB::raw('SUM((invoice_items.qty - COALESCE(invoice_items.returned_qty, 0)) * product_variants.cost_price) as total_cogs'),
                DB::raw('SUM(invoice_items.total) - SUM((invoice_items.qty - COALESCE(invoice_items.returned_qty, 0)) * product_variants.cost_price) as profit')
            )
            ->groupBy('products.name', 'product_variants.variant_name')
            ->havingRaw('total_qty > 0')
            ->orderByDesc('profit')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $rev = (float) $item->total_revenue;
                $prof = (float) $item->profit;
                return [
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'total_qty' => (float) $item->total_qty,
                    'total_revenue' => $rev,
                    'total_cogs' => (float) $item->total_cogs,
                    'profit' => $prof,
                    'margin_pct' => $rev > 0 ? round(($prof / $rev) * 100, 1) : 0,
                ];
            });

        // Days calculation for accurate averages
        $days = 30;
        if ($from && $to) {
            $days = max(1, \Carbon\Carbon::parse($from)->diffInDays(\Carbon\Carbon::parse($to)) + 1);
        }
        $weeks = max(1, round($days / 7, 1));

        return $this->success([
            'gross_revenue' => $grossRevenue,
            'total_subtotal' => $totalSubtotal,
            'total_discount' => $totalDiscount,
            'total_returns' => $totalReturns,
            'total_revenue' => $totalRevenue,
            'total_cogs' => $totalCogs,
            'gross_profit' => $grossProfit,
            'total_expenses' => $totalExpenses,
            'salesman_commission' => $totalSalesmanCommission,
            'damage_loss' => $totalDamageLoss,
            'net_profit' => $netProfit,
            'gross_margin_pct' => $grossMarginPct,
            'net_margin_pct' => $netMarginPct,
            'expense_ratio_pct' => $expenseRatioPct,
            'cogs_ratio_pct' => $cogsRatioPct,
            'expense_breakdown' => $expenseBreakdown,
            'top_profitable_products' => $topProfitableProducts,
            'total_cash_collected' => $totalCashCollected,
            'cash_in_hand_profit' => $cashInHandProfit,
            'period_days' => $days,
            'daily_avg' => round($netProfit / $days, 2),
            'weekly_avg' => [
                'revenue' => round($totalRevenue / $weeks, 2),
                'cogs' => round($totalCogs / $weeks, 2),
                'gross_profit' => round($grossProfit / $weeks, 2),
                'expenses' => round($totalExpenses / $weeks, 2),
                'net_profit' => round($netProfit / $weeks, 2),
            ],
        ]);
    }

    public function monthlySales(): JsonResponse
    {
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $months->push(now()->subMonths($i));
        }

        $sales = Invoice::selectRaw('YEAR(date) as year, MONTH(date) as month, SUM(total) as total')
            ->where('date', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('year', 'month')
            ->get()
            ->keyBy(fn ($row) => $row->year . '-' . str_pad((string) $row->month, 2, '0', STR_PAD_LEFT));

        $result = $months->map(function ($date) use ($sales) {
            $key = $date->format('Y-m');
            $row = $sales->get($key);

            return [
                'month' => $date->format('M'),
                'total' => $row ? (float) $row->total : 0,
            ];
        })->values();

        return $this->success($result);
    }
    private function getFinancialTimeline(Request $request)
    {
        $period = strtolower($request->get('period', 'monthly'));
        $points = collect();

        if ($period === 'daily') {
            for ($i = 13; $i >= 0; $i--) {
                $d = now()->subDays($i);
                $points->push([
                    'key' => $d->format('Y-m-d'),
                    'label' => $d->format('d M'),
                ]);
            }
            $startDate = now()->subDays(13)->startOfDay();
            $groupFormat = 'Y-m-d';
        } elseif ($period === 'weekly') {
            for ($i = 7; $i >= 0; $i--) {
                $d = now()->subWeeks($i)->startOfWeek();
                $points->push([
                    'key' => $d->format('o-W'),
                    'label' => $d->format('d M'),
                ]);
            }
            $startDate = now()->subWeeks(7)->startOfWeek();
            $groupFormat = 'o-W';
        } elseif ($period === 'yearly') {
            $currYear = (int) now()->format('Y');
            for ($i = 4; $i >= 0; $i--) {
                $yr = (string) ($currYear - $i);
                $points->push([
                    'key' => $yr,
                    'label' => $yr,
                ]);
            }
            $startDate = now()->subYears(4)->startOfYear();
            $groupFormat = 'Y';
        } else {
            // monthly (default)
            for ($i = 5; $i >= 0; $i--) {
                $d = now()->subMonths($i);
                $points->push([
                    'key' => $d->format('Y-m'),
                    'label' => $d->format('M'),
                ]);
            }
            $startDate = now()->subMonths(5)->startOfMonth();
            $groupFormat = 'Y-m';
        }

        $sales = Invoice::where('date', '>=', $startDate)
            ->get()
            ->groupBy(fn ($row) => \Carbon\Carbon::parse($row->date)->format($groupFormat));

        $returns = SaleReturn::where('date', '>=', $startDate)
            ->get()
            ->groupBy(fn ($row) => \Carbon\Carbon::parse($row->date)->format($groupFormat));

        $expenses = Expense::where('date', '>=', $startDate)
            ->get()
            ->groupBy(fn ($row) => \Carbon\Carbon::parse($row->date)->format($groupFormat));

        return $points->map(function ($p) use ($sales, $returns, $expenses) {
            $key = $p['key'];

            $grossSales = isset($sales[$key]) ? (float) $sales[$key]->sum('total') : 0;
            $returnAmt = isset($returns[$key]) ? (float) $returns[$key]->sum('total') : 0;
            $netRevenue = max(0, $grossSales - $returnAmt);

            $expense = isset($expenses[$key]) ? (float) $expenses[$key]->sum('amount') : 0;
            $profit = $netRevenue - $expense;

            return [
                'label'   => $p['label'],
                'period'  => $p['label'],
                'month'   => $p['label'],
                'revenue' => round($netRevenue, 2),
                'expense' => round($expense, 2),
                'profit'  => round($profit, 2),
            ];
        })->values();
    }

    public function monthlyFinancial(Request $request): JsonResponse
    {
        return $this->success($this->getFinancialTimeline($request));
    }

    public function expenseBreakdown(): JsonResponse
    {
        $data = Expense::selectRaw("
                category,
                SUM(amount) as total
            ")
            ->groupBy("category")
            ->orderByDesc("total")
            ->get();

        return $this->success($data);
    }

    public function profitTrend(Request $request): JsonResponse
    {
        return $this->success($this->getFinancialTimeline($request));
    }

    public function dashboard(): JsonResponse
{
    $sales = Invoice::sum('total');

    $salesPaid = Invoice::sum('paid');

    $salesPending = Invoice::sum('balance');

    $purchase = DB::table('purchases')->sum('total');

    $purchasePaid = DB::table('purchases')->sum('paid');

    $purchaseRemaining = DB::table('purchases')->sum('balance');

    $expenses = Expense::sum('amount');

    return $this->success([
        'sales' => [
            'count' => Invoice::count(),
            'total' => (float)$sales,
            'paid' => (float)$salesPaid,
            'pending' => (float)$salesPending,
        ],

        'purchase' => [
            'count' => DB::table('purchases')->count(),
            'total' => (float)$purchase,
            'paid' => (float)$purchasePaid,
            'remaining' => (float)$purchaseRemaining,
        ],

        'expense' => [
            'count' => Expense::count(),
            'total' => (float)$expenses,
        ],

        'profit' => [
            'net' => (float)($sales-$purchase-$expenses)
        ]
    ]);
}

public function topProducts(): JsonResponse
{
    $data = DB::table('invoice_items')
        ->join('products', 'invoice_items.product_id', '=', 'products.id')
        ->select(
            'products.id',
            'products.name as product',
            DB::raw('SUM(invoice_items.qty) as qty'),
            DB::raw('SUM(invoice_items.total) as sales')
        )
        ->groupBy('products.id', 'products.name')
        ->orderByDesc('sales')
        ->limit(10)
        ->get();

    return $this->success($data);
}

public function topCustomers(): JsonResponse
{
    $data = DB::table('invoices')
        ->join('customers', 'invoices.customer_id', '=', 'customers.id')
        ->select(
            'customers.id',
            'customers.name as customer',
            DB::raw('SUM(invoices.total) as sales'),
            DB::raw('COUNT(invoices.id) as invoices')
        )
        ->groupBy('customers.id', 'customers.name')
        ->orderByDesc('sales')
        ->limit(10)
        ->get();

    return $this->success($data);
}

public function dailySales(): JsonResponse
{
    $days = collect();

    for ($i = 6; $i >= 0; $i--) {
        $days->push(now()->subDays($i));
    }

    $sales = Invoice::selectRaw("
            DATE(date) as sale_date,
            SUM(total) as total
        ")
        ->where('date', '>=', now()->subDays(6)->startOfDay())
        ->groupBy(DB::raw('DATE(date)'))
        ->get()
        ->keyBy('sale_date');

    $result = $days->map(function ($day) use ($sales) {

        $key = $day->format('Y-m-d');

        return [
            'day'   => $day->format('D'),
            'sales' => $sales[$key]->total ?? 0,
        ];
    });

    return $this->success($result->values());
}

public function areaSales(Request $request): JsonResponse
{
    $from = $request->from_date;
    $to = $request->to_date;

    $query = DB::table('areas')
        ->leftJoin('customers', 'areas.id', '=', 'customers.area_id')
        ->leftJoin('invoices', function ($join) use ($from, $to) {
            $join->on('customers.id', '=', 'invoices.customer_id');
            if ($from) {
                $join->whereDate('invoices.date', '>=', $from);
            }
            if ($to) {
                $join->whereDate('invoices.date', '<=', $to);
            }
        })
        ->select(
            'areas.id as area_id',
            'areas.name as area_name',
            'areas.city',
            DB::raw('COUNT(DISTINCT customers.id) as customer_count'),
            DB::raw('COUNT(DISTINCT invoices.id) as invoices_count'),
            DB::raw('COALESCE(SUM(invoices.total), 0) as total_sales'),
            DB::raw('COALESCE(SUM(invoices.paid), 0) as total_paid'),
            DB::raw('COALESCE(SUM(invoices.balance), 0) as total_balance')
        )
        ->groupBy('areas.id', 'areas.name', 'areas.city')
        ->orderByDesc('total_sales')
        ->get();

    $unassignedQuery = DB::table('customers')
        ->whereNull('customers.area_id')
        ->leftJoin('invoices', function ($join) use ($from, $to) {
            $join->on('customers.id', '=', 'invoices.customer_id');
            if ($from) {
                $join->whereDate('invoices.date', '>=', $from);
            }
            if ($to) {
                $join->whereDate('invoices.date', '<=', $to);
            }
        })
        ->select(
            DB::raw('0 as area_id'),
            DB::raw("'General / Direct (Unassigned)' as area_name"),
            DB::raw("'Hyderabad' as city"),
            DB::raw('COUNT(DISTINCT customers.id) as customer_count'),
            DB::raw('COUNT(DISTINCT invoices.id) as invoices_count'),
            DB::raw('COALESCE(SUM(invoices.total), 0) as total_sales'),
            DB::raw('COALESCE(SUM(invoices.paid), 0) as total_paid'),
            DB::raw('COALESCE(SUM(invoices.balance), 0) as total_balance')
        )
        ->first();

    $result = $query;
    if ($unassignedQuery && ($unassignedQuery->customer_count > 0 || $unassignedQuery->total_sales > 0)) {
        $result->push($unassignedQuery);
    }

    return $this->success($result);
}

public function salesmenPerformance(Request $request): JsonResponse
{
    $from = $request->from_date;
    $to = $request->to_date;

    $salesmen = DB::table('salesmen')
        ->leftJoin('invoices', function ($join) use ($from, $to) {
            $join->on('salesmen.id', '=', 'invoices.salesman_id');
            if ($from) {
                $join->whereDate('invoices.date', '>=', $from);
            }
            if ($to) {
                $join->whereDate('invoices.date', '<=', $to);
            }
        })
        ->select(
            'salesmen.id',
            'salesmen.name',
            'salesmen.phone',
            'salesmen.commission_rate',
            'salesmen.status',
            DB::raw('COUNT(DISTINCT invoices.id) as invoices_count'),
            DB::raw('COALESCE(SUM(invoices.total), 0) as total_sales'),
            DB::raw('COALESCE(SUM(invoices.paid), 0) as total_paid'),
            DB::raw('COALESCE(SUM(invoices.commission_amount), 0) as total_commission')
        )
        ->groupBy('salesmen.id', 'salesmen.name', 'salesmen.phone', 'salesmen.commission_rate', 'salesmen.status')
        ->orderByDesc('total_sales')
        ->get();

    return $this->success($salesmen);
}

public function supplyMenPerformance(Request $request): JsonResponse
{
    $from = $request->from_date;
    $to = $request->to_date;

    $drivers = DB::table('delivery_men')
        ->leftJoin('invoices', function ($join) use ($from, $to) {
            $join->on('delivery_men.id', '=', 'invoices.delivery_man_id');
            if ($from) {
                $join->whereDate('invoices.date', '>=', $from);
            }
            if ($to) {
                $join->whereDate('invoices.date', '<=', $to);
            }
        })
        ->select(
            'delivery_men.id',
            'delivery_men.name',
            'delivery_men.phone',
            'delivery_men.vehicle_no',
            'delivery_men.status',
            DB::raw('COUNT(DISTINCT invoices.id) as total_invoices'),
            DB::raw("COUNT(DISTINCT CASE WHEN invoices.delivery_status = 'delivered' THEN invoices.id END) as delivered_count"),
            DB::raw("COUNT(DISTINCT CASE WHEN invoices.delivery_status IN ('pending_delivery', 'dispatched') THEN invoices.id END) as pending_count"),
            DB::raw("COUNT(DISTINCT CASE WHEN invoices.delivery_status = 'returned' THEN invoices.id END) as returned_count"),
            DB::raw('COALESCE(SUM(invoices.total), 0) as total_delivered_volume'),
            DB::raw('COALESCE(SUM(invoices.paid), 0) as total_collected_cash'),
            DB::raw('COALESCE(SUM(invoices.balance), 0) as total_pending_cash')
        )
        ->groupBy('delivery_men.id', 'delivery_men.name', 'delivery_men.phone', 'delivery_men.vehicle_no', 'delivery_men.status')
        ->orderByDesc('total_delivered_volume')
        ->get();

    return $this->success($drivers);
}

public function areaRecovery(Request $request): JsonResponse
{
    $from = $request->from_date;
    $to = $request->to_date;

    $areas = DB::table('areas')->orderBy('name')->get();
    $report = [];

    foreach ($areas as $area) {
        $customerIds = DB::table('customers')->where('area_id', $area->id)->pluck('id');
        $customerCount = $customerIds->count();
        $currentUdhar = DB::table('customers')->where('area_id', $area->id)->sum('balance');

        // Customer payments (Receive Payment) in period
        $paymentsQuery = DB::table('customer_payments')->whereIn('customer_id', $customerIds);
        if ($from) {
            $paymentsQuery->whereDate('date', '>=', $from);
        }
        if ($to) {
            $paymentsQuery->whereDate('date', '<=', $to);
        }
        $recoveryAmount = (float) $paymentsQuery->sum('amount');
        $recoveryCount = (int) $paymentsQuery->count();

        // Counter invoice cash in period
        $invoiceCashQuery = DB::table('invoices')->whereIn('customer_id', $customerIds);
        if ($from) {
            $invoiceCashQuery->whereDate('date', '>=', $from);
        }
        if ($to) {
            $invoiceCashQuery->whereDate('date', '<=', $to);
        }
        $invoiceCash = (float) $invoiceCashQuery->sum('paid');

        $report[] = [
            'area_id' => $area->id,
            'area_name' => $area->name,
            'city' => $area->city ?? 'Hyderabad',
            'customers_count' => $customerCount,
            'current_udhar' => (float) $currentUdhar,
            'recovery_amount' => $recoveryAmount,
            'recovery_count' => $recoveryCount,
            'invoice_cash' => $invoiceCash,
            'total_collected' => $recoveryAmount + $invoiceCash,
        ];
    }

    // Unassigned
    $unassignedCustomerIds = DB::table('customers')->whereNull('area_id')->pluck('id');
    if ($unassignedCustomerIds->count() > 0) {
        $currentUdhar = DB::table('customers')->whereNull('area_id')->sum('balance');

        $paymentsQuery = DB::table('customer_payments')->whereIn('customer_id', $unassignedCustomerIds);
        if ($from) $paymentsQuery->whereDate('date', '>=', $from);
        if ($to) $paymentsQuery->whereDate('date', '<=', $to);
        $recoveryAmount = (float) $paymentsQuery->sum('amount');
        $recoveryCount = (int) $paymentsQuery->count();

        $invoiceCashQuery = DB::table('invoices')->whereIn('customer_id', $unassignedCustomerIds);
        if ($from) $invoiceCashQuery->whereDate('date', '>=', $from);
        if ($to) $invoiceCashQuery->whereDate('date', '<=', $to);
        $invoiceCash = (float) $invoiceCashQuery->sum('paid');

        $report[] = [
            'area_id' => null,
            'area_name' => 'General / Direct (Unassigned)',
            'city' => 'Hyderabad',
            'customers_count' => $unassignedCustomerIds->count(),
            'current_udhar' => (float) $currentUdhar,
            'recovery_amount' => $recoveryAmount,
            'recovery_count' => $recoveryCount,
            'invoice_cash' => $invoiceCash,
            'total_collected' => $recoveryAmount + $invoiceCash,
        ];
    }

    usort($report, fn($a, $b) => $b['total_collected'] <=> $a['total_collected']);

    return $this->success($report);
}

public function inventoryVelocity(Request $request): JsonResponse
{
    $periodDays = $request->input('period', 60);
    $categoryId = $request->input('category_id');
    $statusFilter = $request->input('status');
    $search = $request->input('search');

    $now = now();
    $cutoff = ($periodDays === 'all') ? null : $now->copy()->subDays((int)$periodDays);

    $variantsQuery = DB::table('product_variants')
        ->join('products', 'product_variants.product_id', '=', 'products.id')
        ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
        ->select(
            'product_variants.id as variant_id',
            'product_variants.variant_name',
            'product_variants.sku as variant_sku',
            'product_variants.barcode',
            'product_variants.batch_no',
            'product_variants.expiry_date',
            'product_variants.cost_price',
            'product_variants.price as selling_price',
            'product_variants.stock_qty',
            'product_variants.reorder_level',
            'products.id as product_id',
            'products.name as product_name',
            'products.category_id',
            'categories.name as category_name',
            'products.created_at as product_created_at'
        );

    if ($categoryId) {
        $variantsQuery->where('products.category_id', $categoryId);
    }

    if ($search) {
        $variantsQuery->where(function ($q) use ($search) {
            $q->where('products.name', 'like', "%{$search}%")
              ->orWhere('product_variants.variant_name', 'like', "%{$search}%")
              ->orWhere('product_variants.sku', 'like', "%{$search}%")
              ->orWhere('product_variants.batch_no', 'like', "%{$search}%");
        });
    }

    $variants = $variantsQuery->get();

    $salesQuery = DB::table('invoice_items')
        ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id');
    
    if ($cutoff) {
        $salesQuery->whereDate('invoices.date', '>=', $cutoff->toDateString());
    }

    $salesPeriod = $salesQuery
        ->select(
            'invoice_items.product_variant_id',
            DB::raw('COALESCE(SUM(invoice_items.qty - COALESCE(invoice_items.returned_qty, 0)), 0) as units_sold'),
            DB::raw('COALESCE(SUM(invoice_items.total), 0) as revenue')
        )
        ->groupBy('invoice_items.product_variant_id')
        ->get()
        ->keyBy('product_variant_id');

    $lastSales = DB::table('invoice_items')
        ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
        ->select(
            'invoice_items.product_variant_id',
            DB::raw('MAX(invoices.date) as last_sale_date')
        )
        ->groupBy('invoice_items.product_variant_id')
        ->get()
        ->keyBy('product_variant_id');

    $items = [];
    $totalDeadStockCost = 0;
    $totalDeadStockRetail = 0;
    $deadCount = 0;
    $fastCount = 0;
    $slowCount = 0;
    $outOfStockCount = 0;
    $totalStockCost = 0;

    foreach ($variants as $v) {
        $stockQty = (float)$v->stock_qty;
        $costPrice = (float)$v->cost_price;
        $sellPrice = (float)$v->selling_price;
        $stockValCost = $stockQty * $costPrice;
        $stockValRetail = $stockQty * $sellPrice;
        $totalStockCost += $stockValCost;

        $saleInfo = $salesPeriod->get($v->variant_id);
        $unitsSold = $saleInfo ? (float)$saleInfo->units_sold : 0;
        $revenue = $saleInfo ? (float)$saleInfo->revenue : 0;

        $lastSale = $lastSales->get($v->variant_id);
        $lastSaleDate = $lastSale ? $lastSale->last_sale_date : null;

        $daysInactive = null;
        if ($lastSaleDate) {
            $daysInactive = (int)\Carbon\Carbon::parse($lastSaleDate)->diffInDays($now);
        } else if ($v->product_created_at) {
            $daysInactive = (int)\Carbon\Carbon::parse($v->product_created_at)->diffInDays($now);
        }

        if ($stockQty <= 0) {
            $movementStatus = 'out_of_stock';
            $statusLabel = 'Out of Stock';
            $action = 'Restock if in demand';
            $outOfStockCount++;
        } elseif ($unitsSold == 0) {
            $movementStatus = 'dead';
            $statusLabel = 'Dead Stock (0 Sales)';
            $action = 'Clearance Discount 15-30% Recommended';
            $deadCount++;
            if ($stockQty > 0) {
                $totalDeadStockCost += $stockValCost;
                $totalDeadStockRetail += $stockValRetail;
            }
        } elseif ($unitsSold >= 10 || ($daysInactive !== null && $daysInactive <= 14 && $unitsSold >= 5)) {
            $movementStatus = 'fast';
            $statusLabel = 'Fast Moving (Top Seller)';
            $action = 'High Demand - Maintain Stock Buffer';
            $fastCount++;
        } else {
            $movementStatus = 'slow';
            $statusLabel = 'Slow Moving';
            $action = 'Monitor Sales / Normal Stock';
            $slowCount++;
        }

        if ($statusFilter && $statusFilter !== 'all' && $movementStatus !== $statusFilter) {
            continue;
        }

        $items[] = [
            'variant_id' => $v->variant_id,
            'product_id' => $v->product_id,
            'product_name' => $v->product_name,
            'variant_name' => $v->variant_name,
            'full_name' => $v->product_name . ' (' . $v->variant_name . ')',
            'category_name' => $v->category_name ?? 'General',
            'sku' => $v->variant_sku,
            'barcode' => $v->barcode,
            'batch_no' => $v->batch_no,
            'expiry_date' => $v->expiry_date,
            'stock_qty' => $stockQty,
            'reorder_level' => (float)$v->reorder_level,
            'cost_price' => $costPrice,
            'selling_price' => $sellPrice,
            'stock_value_cost' => $stockValCost,
            'stock_value_retail' => $stockValRetail,
            'units_sold' => $unitsSold,
            'revenue' => $revenue,
            'last_sale_date' => $lastSaleDate,
            'days_inactive' => $daysInactive,
            'movement_status' => $movementStatus,
            'status_label' => $statusLabel,
            'action_suggestion' => $action,
        ];
    }

    usort($items, function ($a, $b) {
        if ($a['movement_status'] === 'dead' && $b['movement_status'] !== 'dead') return -1;
        if ($b['movement_status'] === 'dead' && $a['movement_status'] !== 'dead') return 1;
        return $b['units_sold'] <=> $a['units_sold'];
    });

    return $this->success([
        'items' => $items,
        'summary' => [
            'period_days' => $periodDays,
            'total_products_tracked' => count($variants),
            'dead_stock_count' => $deadCount,
            'dead_stock_cost_value' => $totalDeadStockCost,
            'dead_stock_retail_value' => $totalDeadStockRetail,
            'fast_moving_count' => $fastCount,
            'slow_moving_count' => $slowCount,
            'out_of_stock_count' => $outOfStockCount,
            'total_stock_capital' => $totalStockCost,
        ],
    ]);
}

public function expiryAlerts(Request $request): JsonResponse
{
    $thresholdDays = (int)$request->input('threshold_days', 30);
    $statusFilter = $request->input('status', 'all');
    $search = $request->input('search');

    $today = now()->startOfDay();
    $thresholdDate = now()->addDays($thresholdDays)->endOfDay();

    $query = DB::table('product_variants')
        ->join('products', 'product_variants.product_id', '=', 'products.id')
        ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
        ->select(
            'product_variants.id as variant_id',
            'product_variants.variant_name',
            'product_variants.sku',
            'product_variants.barcode',
            'product_variants.batch_no',
            'product_variants.expiry_date',
            'product_variants.mfg_date',
            'product_variants.stock_qty',
            'product_variants.cost_price',
            'product_variants.price as selling_price',
            'products.id as product_id',
            'products.name as product_name',
            'categories.name as category_name'
        );

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('products.name', 'like', "%{$search}%")
              ->orWhere('product_variants.variant_name', 'like', "%{$search}%")
              ->orWhere('product_variants.batch_no', 'like', "%{$search}%")
              ->orWhere('product_variants.sku', 'like', "%{$search}%");
        });
    }

    $variants = $query->get();

    $items = [];
    $expiredCount = 0;
    $expiredValue = 0;
    $expiringSoonCount = 0;
    $expiringSoonValue = 0;
    $validCount = 0;
    $noExpiryCount = 0;

    foreach ($variants as $v) {
        $stockQty = (float)$v->stock_qty;
        $costPrice = (float)$v->cost_price;
        $stockCost = $stockQty * $costPrice;

        $expiryDate = $v->expiry_date ? \Carbon\Carbon::parse($v->expiry_date)->startOfDay() : null;
        $mfgDate = $v->mfg_date ? \Carbon\Carbon::parse($v->mfg_date)->format('Y-m-d') : null;

        $status = 'no_expiry';
        $statusLabel = 'No Expiry Set';
        $daysLeft = null;
        $urgency = 'normal';

        if ($expiryDate) {
            $daysLeft = (int)$today->diffInDays($expiryDate, false);

            if ($daysLeft < 0) {
                $status = 'expired';
                $statusLabel = 'Expired (' . abs($daysLeft) . ' days ago)';
                $urgency = 'danger';
                if ($stockQty > 0) {
                    $expiredCount++;
                    $expiredValue += $stockCost;
                }
            } elseif ($daysLeft <= $thresholdDays) {
                $status = 'expiring_soon';
                $statusLabel = ($daysLeft === 0) ? 'Expiring Today!' : 'Expiring in ' . $daysLeft . ' days';
                $urgency = 'warning';
                if ($stockQty > 0) {
                    $expiringSoonCount++;
                    $expiringSoonValue += $stockCost;
                }
            } else {
                $status = 'valid';
                $statusLabel = 'Valid (' . $daysLeft . ' days left)';
                $urgency = 'safe';
                if ($stockQty > 0) {
                    $validCount++;
                }
            }
        } else {
            $noExpiryCount++;
        }

        if ($statusFilter && $statusFilter !== 'all' && $status !== $statusFilter) {
            continue;
        }

        $items[] = [
            'variant_id' => $v->variant_id,
            'product_id' => $v->product_id,
            'product_name' => $v->product_name,
            'variant_name' => $v->variant_name,
            'full_name' => $v->product_name . ' (' . $v->variant_name . ')',
            'category_name' => $v->category_name ?? 'General',
            'sku' => $v->sku,
            'barcode' => $v->barcode,
            'batch_no' => $v->batch_no ?: '—',
            'expiry_date' => $expiryDate ? $expiryDate->format('Y-m-d') : null,
            'mfg_date' => $mfgDate,
            'days_left' => $daysLeft,
            'stock_qty' => $stockQty,
            'cost_price' => $costPrice,
            'selling_price' => (float)$v->selling_price,
            'stock_value_cost' => $stockCost,
            'status' => $status,
            'status_label' => $statusLabel,
            'urgency' => $urgency,
        ];
    }

    usort($items, function ($a, $b) {
        if ($a['status'] === 'expired' && $b['status'] !== 'expired') return -1;
        if ($b['status'] === 'expired' && $a['status'] !== 'expired') return 1;
        if ($a['status'] === 'expiring_soon' && $b['status'] === 'valid') return -1;
        if ($b['status'] === 'expiring_soon' && $a['status'] === 'valid') return 1;
        return ($a['days_left'] ?? 9999) <=> ($b['days_left'] ?? 9999);
    });

    return $this->success([
        'items' => $items,
        'summary' => [
            'expired_count' => $expiredCount,
            'expired_stock_value' => $expiredValue,
            'expiring_soon_count' => $expiringSoonCount,
            'expiring_soon_stock_value' => $expiringSoonValue,
            'valid_count' => $validCount,
            'no_expiry_count' => $noExpiryCount,
            'threshold_days' => $thresholdDays,
        ],
    ]);
}
}
