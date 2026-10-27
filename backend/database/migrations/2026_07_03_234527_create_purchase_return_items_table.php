<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_return_items', function (Blueprint $table) {

            $table->id();

            $table->foreignId('purchase_return_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->decimal('qty',10,2);

            $table->decimal('unit_cost',10,2);

            $table->decimal('total',10,2);

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_return_items');
    }
};