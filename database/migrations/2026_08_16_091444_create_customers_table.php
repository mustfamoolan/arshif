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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('commercial_name');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('location_address')->nullable();
            $table->boolean('is_main_street')->default(false);
            $table->boolean('is_side_street')->default(false);
            $table->boolean('inside_residential_complex')->default(false);
            $table->boolean('inside_residential_area')->default(false);
            $table->string('nearest_landmark')->nullable();
            $table->string('customer_area')->nullable();
            $table->string('estimated_area')->nullable(); // '10_30', '30_80', '80_plus'
            $table->json('trust_items')->nullable(); // stored as JSON array of selected items
            $table->string('trust_code')->nullable();
            $table->string('sign_type')->nullable();
            $table->string('phone')->nullable();
            $table->string('refrigerator_photo')->nullable(); // path to uploaded photo
            $table->string('status')->default('active'); // 'active', 'inactive'
            $table->string('classification')->default('C'); // 'A', 'B', 'C'
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
