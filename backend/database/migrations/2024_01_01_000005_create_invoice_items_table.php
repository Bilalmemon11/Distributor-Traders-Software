<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::create('invoice_items', function (Blueprint $table) {

        $table->id();

        $table->foreignId('invoice_id')
            ->constrained()
            ->cascadeOnDelete();

        $table->foreignId('product_id')
            ->constrained()
            ->cascadeOnDelete();

        $table->foreignId('product_variant_id')
            ->constrained('product_variants')
            ->cascadeOnDelete();

        $table->decimal('qty',12,2);

        $table->decimal('unit_price',12,2);

        $table->decimal('total',12,2);

        $table->decimal('returned_qty',12,2)
            ->default(0);
        $table->decimal('remaining_qty', 10, 2)
            ->default(0)
            ->after('returned_qty');

        $table->timestamps();

    });
}
    public function down(): void
{
    Schema::dropIfExists('invoice_items');
}
};
