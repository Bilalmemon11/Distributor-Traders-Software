<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_returns', function (Blueprint $table) {

            $table->id();

            $table->string('return_no')->unique();

            $table->foreignId('purchase_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('vendor_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('date');

            $table->decimal('total',10,2);

            $table->text('reason')->nullable();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};