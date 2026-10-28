<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Areas Table
        if (!Schema::hasTable('areas')) {
            Schema::create('areas', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('city')->default('Hyderabad');
                $table->text('description')->nullable();
                $table->timestamps();
            });

            // Seed initial Hyderabad areas
            $hyderabadAreas = [
                'Latifabad',
                'Hussainabad',
                'Qasimabad',
                'Naseem Nagar',
                'Citizen Colony',
                'Saddar',
                'Auto Bhan',
                'Market / Shahi Bazaar',
                'Wadhu Wah Road',
                'Hirabad',
            ];

            foreach ($hyderabadAreas as $area) {
                DB::table('areas')->insert([
                    'name' => $area,
                    'city' => 'Hyderabad',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 2. Salesmen / Bookers Table
        if (!Schema::hasTable('salesmen')) {
            Schema::create('salesmen', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('phone')->nullable();
                $table->decimal('commission_rate', 5, 2)->default(0);
                $table->boolean('status')->default(true);
                $table->timestamps();
            });

            // Seed default salesman: Self / Admin
            DB::table('salesmen')->insert([
                'name' => 'Self / Admin (Direct Sale)',
                'phone' => null,
                'commission_rate' => 0.00,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Add area_id to customers table
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'area_id')) {
                $table->unsignedBigInteger('area_id')->nullable()->after('address');
            }
        });

        // 4. Add salesman_id and commission_amount to invoices table
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'salesman_id')) {
                $table->unsignedBigInteger('salesman_id')->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('invoices', 'commission_amount')) {
                $table->decimal('commission_amount', 10, 2)->default(0)->after('balance');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'commission_amount')) {
                $table->dropColumn('commission_amount');
            }
            if (Schema::hasColumn('invoices', 'salesman_id')) {
                $table->dropColumn('salesman_id');
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (Schema::hasColumn('customers', 'area_id')) {
                $table->dropColumn('area_id');
            }
        });

        Schema::dropIfExists('salesmen');
        Schema::dropIfExists('areas');
    }
};
