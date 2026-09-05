<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proforma_requests', function (Blueprint $table) {
            $table->string('payment_type')->default('cash')->after('deadline');
            $table->integer('credit_period')->nullable()->after('payment_type');
        });
    }

    public function down(): void
    {
        Schema::table('proforma_requests', function (Blueprint $table) {
            $table->dropColumn(['payment_type', 'credit_period']);
        });
    }
};
