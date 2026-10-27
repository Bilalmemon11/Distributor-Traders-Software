<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->dropForeign(['variant_id']);
            $table->dropColumn('variant_id');
        });
    }
};
