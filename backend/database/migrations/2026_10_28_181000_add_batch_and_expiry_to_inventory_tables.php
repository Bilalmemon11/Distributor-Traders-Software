<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add batch & expiry to product_variants
        if (Schema::hasTable('product_variants')) {
            Schema::table('product_variants', function (Blueprint $table) {
                if (!Schema::hasColumn('product_variants', 'batch_no')) {
                    $table->string('batch_no')->nullable()->after('barcode');
                }
                if (!Schema::hasColumn('product_variants', 'expiry_date')) {
                    $table->date('expiry_date')->nullable()->after('batch_no');
                }
                if (!Schema::hasColumn('product_variants', 'mfg_date')) {
                    $table->date('mfg_date')->nullable()->after('expiry_date');
                }
            });
        }

        // 2. Add batch & expiry to products table
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'batch_no')) {
                    $table->string('batch_no')->nullable()->after('reorder_level');
                }
                if (!Schema::hasColumn('products', 'expiry_date')) {
                    $table->date('expiry_date')->nullable()->after('batch_no');
                }
                if (!Schema::hasColumn('products', 'mfg_date')) {
                    $table->date('mfg_date')->nullable()->after('expiry_date');
                }
            });
        }

        // 3. Add batch & expiry to purchase_items
        if (Schema::hasTable('purchase_items')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_items', 'batch_no')) {
                    $table->string('batch_no')->nullable()->after('total');
                }
                if (!Schema::hasColumn('purchase_items', 'expiry_date')) {
                    $table->date('expiry_date')->nullable()->after('batch_no');
                }
            });
        }

        // 4. Add batch & expiry to invoice_items
        if (Schema::hasTable('invoice_items')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                if (!Schema::hasColumn('invoice_items', 'batch_no')) {
                    $table->string('batch_no')->nullable()->after('total');
                }
                if (!Schema::hasColumn('invoice_items', 'expiry_date')) {
                    $table->date('expiry_date')->nullable()->after('batch_no');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('product_variants')) {
            Schema::table('product_variants', function (Blueprint $table) {
                if (Schema::hasColumn('product_variants', 'mfg_date')) $table->dropColumn('mfg_date');
                if (Schema::hasColumn('product_variants', 'expiry_date')) $table->dropColumn('expiry_date');
                if (Schema::hasColumn('product_variants', 'batch_no')) $table->dropColumn('batch_no');
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'mfg_date')) $table->dropColumn('mfg_date');
                if (Schema::hasColumn('products', 'expiry_date')) $table->dropColumn('expiry_date');
                if (Schema::hasColumn('products', 'batch_no')) $table->dropColumn('batch_no');
            });
        }

        if (Schema::hasTable('purchase_items')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_items', 'expiry_date')) $table->dropColumn('expiry_date');
                if (Schema::hasColumn('purchase_items', 'batch_no')) $table->dropColumn('batch_no');
            });
        }

        if (Schema::hasTable('invoice_items')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                if (Schema::hasColumn('invoice_items', 'expiry_date')) $table->dropColumn('expiry_date');
                if (Schema::hasColumn('invoice_items', 'batch_no')) $table->dropColumn('batch_no');
            });
        }
    }
};
