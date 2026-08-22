<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Customer;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->text('refrigerator_photo')->nullable()->change();
        });

        // Convert existing legacy single image string paths to JSON arrays
        // This is safe even if there are no legacy values or they are already JSON
        $customers = Customer::all();
        foreach ($customers as $customer) {
            $rawVal = $customer->getRawOriginal('refrigerator_photo');
            if ($rawVal && !empty(trim($rawVal))) {
                $trimmed = trim($rawVal);
                if (!str_starts_with($trimmed, '[') && !str_starts_with($trimmed, '{')) {
                    $customer->setRawAttributes([
                        'refrigerator_photo' => json_encode([$trimmed])
                    ]);
                    $customer->save();
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('refrigerator_photo')->nullable()->change();
        });
    }
};
