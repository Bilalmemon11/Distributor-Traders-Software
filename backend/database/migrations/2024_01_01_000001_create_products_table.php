<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {

            $table->id();

            $table->string('sku')->unique();

            $table->string('name');

            $table->foreignId('category_id')->constrained()->cascadeOnUpdate();

            $table->string('brand')->nullable();

            $table->foreignId('unit_id')->constrained()->cascadeOnUpdate();

            $table->boolean('status')->default(true);

            $table->text('description')->nullable();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};