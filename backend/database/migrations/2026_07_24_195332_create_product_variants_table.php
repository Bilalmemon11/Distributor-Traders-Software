<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {

            $table->id();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('variant_name');      // Black, Green, 100ml

            $table->string('sku')->nullable();

            $table->decimal('cost_price',12,2)->default(0);

            $table->decimal('price',12,2)->default(0);

            $table->decimal('stock_qty',12,2)->default(0);

            $table->decimal('reorder_level',12,2)->default(0);

            $table->boolean('status')->default(true);

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};