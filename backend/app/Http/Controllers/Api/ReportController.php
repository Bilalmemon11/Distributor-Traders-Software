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
        $totalReturns = (float) $returnQuery->sum('total');
        $totalRevenue = max(0, $grossRevenue - $totalReturns);

        $totalCogs = (float) $invoiceItemQuery
            ->join('product_variants', 'invoice_items.product_variant_id', '=', 'product_variants.id')
            ->selectRaw('SUM((invoice_items.qty - COALESCE(invoice_items.returned_qty, 0)) * product_variants.cost_price) as cogs')
            ->value('cogs') ?? 0;

        $grossProfit = $totalRevenue - $totalCogs;
        $totalExpenses = (float) $expenseQuery->sum('amount');
        $netProfit = $grossProfit - $totalExpenses;

        $grossMarginPct = $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0;
        $netMarginPct = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0;
        $expenseRatioPct = $totalRevenue > 0 ? round(($totalExpenses / $totalRevenue) * 100, 2) : 0;
        $cogsRatioPct = $totalRevenue > 0 ? round(($totalCogs / $totalRevenue) * 100, 2) : 0;

        $expenseBreakdown = $expenseQuery
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        return $this->success([
            'gross_revenue' => $grossRevenue,
            'total_returns' => $totalReturns,
            'total_revenue' => $totalRevenue,
            'total_cogs' => $totalCogs,
            'gross_profit' => $grossProfit,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'gross_margin_pct' => $grossMarginPct,
            'net_margin_pct' => $netMarginPct,
            'expense_ratio_pct' => $expenseRatioPct,
            'cogs_ratio_pct' => $cogsRatioPct,
            'expense_breakdown' => $expenseBreakdown,
            'weekly_avg' => [
                'revenue' => round($totalRevenue / 4, 2),
                'cogs' => round($totalCogs / 4, 2),
                'gross_profit' => round($grossProfit / 4, 2),
                'expenses' => round($totalExpenses / 4, 2),
                'net_profit' => round($netProfit / 4, 2),
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


}
