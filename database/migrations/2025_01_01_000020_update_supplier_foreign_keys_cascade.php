<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proforma_request_suppliers', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->foreign('supplier_id')->references('id')->on('suppliers')->cascadeOnDelete();
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->foreign('supplier_id')->references('id')->on('suppliers')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('proforma_request_suppliers', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->foreign('supplier_id')->references('id')->on('suppliers')->restrictOnDelete();
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->foreign('supplier_id')->references('id')->on('suppliers')->restrictOnDelete();
        });
    }
};
