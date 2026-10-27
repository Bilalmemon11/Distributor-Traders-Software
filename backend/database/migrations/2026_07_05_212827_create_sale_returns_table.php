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
    Schema::create('sale_returns', function (Blueprint $table) {

        $table->id();

        $table->string('return_no')->unique();

        $table->foreignId('invoice_id')
            ->constrained()
            ->cascadeOnDelete();

        $table->foreignId('customer_id')
            ->constrained()
            ->cascadeOnDelete();

        $table->date('date');

        $table->decimal('total',12,2)->default(0);

        $table->text('reason')->nullable();

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_returns');
    }
};
