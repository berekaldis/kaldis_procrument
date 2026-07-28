<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proformas', function (Blueprint $table) {
            $table->json('items')->nullable()->after('notes');
            $table->decimal('total_amount', 15, 2)->nullable()->after('items');
            $table->string('currency', 8)->default('ETB')->after('total_amount');
        });
    }

    public function down(): void
    {
        Schema::table('proformas', function (Blueprint $table) {
            $table->dropColumn(['items', 'total_amount', 'currency']);
        });
    }
};
