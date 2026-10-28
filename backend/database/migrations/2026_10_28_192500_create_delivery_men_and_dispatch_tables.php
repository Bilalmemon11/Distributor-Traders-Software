<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Delivery Men / Supply Men Table
        if (!Schema::hasTable('delivery_men')) {
            Schema::create('delivery_men', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('phone')->nullable();
                $table->string('vehicle_no')->nullable(); // e.g. Suzuki Loader, Van, Bike
                $table->boolean('status')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();
            });

            // Seed default: Self / Direct Delivery (Counter / Self Collection)
            DB::table('delivery_men')->insert([
                'name' => 'Self / Direct (Warehouse / Counter)',
                'phone' => null,
                'vehicle_no' => null,
                'status' => true,
                'notes' => 'Direct counter delivery or customer self pickup',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Add delivery columns to invoices table
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'delivery_man_id')) {
                $table->unsignedBigInteger('delivery_man_id')->nullable()->after('salesman_id');
            }
            if (!Schema::hasColumn('invoices', 'delivery_status')) {
                $table->string('delivery_status')->default('delivered')->after('payment_type');
            }
            if (!Schema::hasColumn('invoices', 'delivery_date')) {
                $table->date('delivery_date')->nullable()->after('delivery_status');
            }
            if (!Schema::hasColumn('invoices', 'delivery_notes')) {
                $table->text('delivery_notes')->nullable()->after('delivery_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'delivery_notes')) {
                $table->dropColumn('delivery_notes');
            }
            if (Schema::hasColumn('invoices', 'delivery_date')) {
                $table->dropColumn('delivery_date');
            }
            if (Schema::hasColumn('invoices', 'delivery_status')) {
                $table->dropColumn('delivery_status');
            }
            if (Schema::hasColumn('invoices', 'delivery_man_id')) {
                $table->dropColumn('delivery_man_id');
            }
        });

        Schema::dropIfExists('delivery_men');
    }
};
