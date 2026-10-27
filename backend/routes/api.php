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
use App\Http\Controllers\BackupController;



Route::prefix('v1')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('products', ProductController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('vendors', VendorController::class);

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

        
    });
    

    Route::apiResource('invoices', InvoiceController::class);
    Route::get('/invoices/{invoice}/print', [InvoiceController::class, 'printInvoice']);

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
