<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add split payment columns to invoices
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('cash_paid', 10, 2)->default(0)->after('paid');
            $table->decimal('online_paid', 10, 2)->default(0)->after('cash_paid');
            $table->string('online_method')->nullable()->after('online_paid');
            $table->string('payment_notes')->nullable()->after('online_method');
        });

        // 2. Add barcode to product_variants
        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('barcode')->nullable()->after('sku');
        });

        // 3. Create held_invoices table
        Schema::create('held_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('hold_name')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->decimal('total', 10, 2)->default(0);
            $table->integer('items_count')->default(0);
            $table->json('invoice_data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('held_invoices');

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('barcode');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['cash_paid', 'online_paid', 'online_method', 'payment_notes']);
        });
    }
};
