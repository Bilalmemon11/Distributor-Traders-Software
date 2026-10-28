<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'default_invoice_size')) {
                $table->string('default_invoice_size')->default('a4')->after('logo');
            }
            if (!Schema::hasColumn('companies', 'show_previous_balance')) {
                $table->boolean('show_previous_balance')->default(true)->after('default_invoice_size');
            }
            if (!Schema::hasColumn('companies', 'show_signatures')) {
                $table->boolean('show_signatures')->default(true)->after('show_previous_balance');
            }
            if (!Schema::hasColumn('companies', 'show_customer_area')) {
                $table->boolean('show_customer_area')->default(true)->after('show_signatures');
            }
            if (!Schema::hasColumn('companies', 'low_stock_threshold')) {
                $table->integer('low_stock_threshold')->default(10)->after('show_customer_area');
            }
            if (!Schema::hasColumn('companies', 'expiry_alert_days')) {
                $table->integer('expiry_alert_days')->default(60)->after('low_stock_threshold');
            }
            if (!Schema::hasColumn('companies', 'allow_negative_stock')) {
                $table->boolean('allow_negative_stock')->default(false)->after('expiry_alert_days');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'default_invoice_size',
                'show_previous_balance',
                'show_signatures',
                'show_customer_area',
                'low_stock_threshold',
                'expiry_alert_days',
                'allow_negative_stock',
            ]);
        });
    }
};
