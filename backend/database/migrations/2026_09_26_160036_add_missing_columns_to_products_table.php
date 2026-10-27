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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('stock_qty')->default(0);
            $table->integer('reorder_level')->default(5);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'price', 'stock_qty', 'reorder_level']);
        });
    }
};
