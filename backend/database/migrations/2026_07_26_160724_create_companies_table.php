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
        Schema::create('companies', function (Blueprint $table) {

            $table->id();

            $table->string('company_name')->nullable();
            $table->string('owner_name')->nullable();

            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();

            $table->string('ntn')->nullable();
            $table->string('strn')->nullable();

            $table->text('address')->nullable();

            $table->string('city')->nullable();
            $table->string('country')->nullable();

            $table->string('currency')->default('PKR');

            $table->string('invoice_prefix')->default('INV');
            $table->string('purchase_prefix')->default('PUR');
            $table->string('return_prefix')->default('RET');

            $table->decimal('tax_percent', 8, 2)->default(0);
            $table->decimal('discount_percent', 8, 2)->default(0);

            $table->text('footer_text')->nullable();
            $table->longText('terms')->nullable();

            $table->string('logo')->nullable();

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};