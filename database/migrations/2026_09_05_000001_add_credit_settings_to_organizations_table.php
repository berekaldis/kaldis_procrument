<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->integer('default_credit_period')->default(30)->after('approval_threshold');
            $table->text('credit_payment_terms')->nullable()->after('default_credit_period');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['default_credit_period', 'credit_payment_terms']);
        });
    }
};
