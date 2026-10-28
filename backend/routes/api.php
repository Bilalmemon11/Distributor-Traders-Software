<?php
use App\Http\Controllers;

use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\InventoryTransactionController;
use App\Http\Controllers\Api\PurchaseReturnController;
use App\Http\Controllers\Api\SaleReturnController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\HeldInvoiceController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\SalesmanController;
use App\Http\Controllers\Api\DeliveryManController;
use App\Http\Controllers\Api\AuthController;

Route::prefix('v1')->group(function () {
    // Authentication
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/update-profile', [AuthController::class, 'updateProfile']);
        Route::get('/users', [AuthController::class, 'getUsers']);
        Route::put('/users/{id}', [AuthController::class, 'updateUserByAdmin']);
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('products', ProductController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('vendors', VendorController::class);
    Route::apiResource('areas', AreaController::class);
    Route::apiResource('salesmen', SalesmanController::class);
    Route::apiResource('delivery-men', DeliveryManController::class);
    Route::get('dispatch-sheet', [DeliveryManController::class, 'dispatchSheet']);
    Route::post('invoices/{invoice}/delivery-status', [DeliveryManController::class, 'updateInvoiceDelivery']);

    Route::apiResource('sale-returns', SaleReturnController::class);
    Route::get('sale-returns/{saleReturn}/print', [SaleReturnController::class, 'print']);
    Route::apiResource('purchases', PurchaseController::class);
    Route::get('purchases/{purchase}/print', [PurchaseController::class, 'print']);
    Route::apiResource('purchase-returns', PurchaseReturnController::class);
    Route::get('purchase-returns/{purchaseReturn}/print',[PurchaseReturnController::class, 'print']);

    Route::apiResource('expenses', ExpenseController::class);
    Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
    Route::post('/expense-categories', [ExpenseCategoryController::class, 'store']);

    Route::post('customers/{id}/receive-payment', [CustomerController::class, 'receivePayment']);
    Route::post('vendors/{id}/pay', [VendorController::class, 'makePayment']);

    Route::prefix('reports')->group(function () {
        Route::get('/profit-loss', [ReportController::class, 'profitLoss']);
        Route::get('/monthly-financial', [ReportController::class, 'monthlyFinancial']);
        Route::get('/monthly-sales', [ReportController::class, 'monthlySales']);
        Route::get('/dashboard',[ReportController::class,'dashboard']);
        Route::get('/expense-breakdown',[ReportController::class,'expenseBreakdown']);
        Route::get('/profit-trend',[ReportController::class,'profitTrend']);

        Route::get('/top-products', [ReportController::class, 'topProducts']);
        Route::get('/top-customers', [ReportController::class, 'topCustomers']);
        Route::get('/daily-sales', [ReportController::class, 'dailySales']);
        Route::get('/area-sales', [ReportController::class, 'areaSales']);
        Route::get('/area-recovery', [ReportController::class, 'areaRecovery']);
        Route::get('/salesmen-performance', [ReportController::class, 'salesmenPerformance']);
        Route::get('/supply-men-performance', [ReportController::class, 'supplyMenPerformance']);
        Route::get('/inventory-velocity', [ReportController::class, 'inventoryVelocity']);
        Route::get('/expiry-alerts', [ReportController::class, 'expiryAlerts']);
    });
    
    Route::post('variants/{id}/batch-expiry', [ProductController::class, 'updateVariantBatchExpiry']);

    Route::apiResource('invoices', InvoiceController::class);
    Route::get('/invoices/{invoice}/print', [InvoiceController::class, 'printInvoice']);
    Route::apiResource('held-invoices', HeldInvoiceController::class)->only(['index', 'store', 'destroy']);

    Route::get('customers/{customer}/ledger', [CustomerController::class, 'ledger']);
    Route::get('customers/{customer}/payments/{payment}/receipt',[CustomerController::class,'printReceipt']);
    Route::get('customers/{customer}/payments',[CustomerController::class,'paymentHistory']);

    Route::get('vendors/{vendor}/payments',[VendorController::class, 'paymentHistory']);
    Route::get('vendors/{vendor}/payments/{payment}/receipt',[VendorController::class, 'printReceipt']);
    Route::get('vendors/{vendor}/ledger',[VendorController::class, 'ledger']);

    Route::get('inventory-transactions', [InventoryTransactionController::class, 'index']);
    Route::get('/inventory-transactions/print',[InventoryTransactionController::class, 'print']);
    Route::post('inventory-transactions/adjust',[InventoryTransactionController::class, 'adjustStock']);

   Route::get('/categories',[CategoryController::class,'index']);
   Route::post('/categories',[CategoryController::class,'store']);

   Route::get('/units',[UnitController::class,'index']);
   Route::post('/units',[UnitController::class,'store']);

   Route::get('/company', [CompanyController::class, 'show']);
   Route::post('/company', [CompanyController::class, 'save']);



Route::prefix('backups')->group(function () {

    Route::get('/', [BackupController::class, 'index']);

    Route::post('/', [BackupController::class, 'store']);

    Route::get('/{id}/download', [BackupController::class, 'download']);

    Route::delete('/{id}', [BackupController::class, 'destroy']);

    Route::post('/restore', [BackupController::class, 'restore']);
});   

});
