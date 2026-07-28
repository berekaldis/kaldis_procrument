<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proforma_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('reference_no')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('requested_by');
            $table->dateTime('deadline')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });

        Schema::create('proforma_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('proforma_requests')->cascadeOnDelete();
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 3)->default(1);
            $table->string('unit')->default('pcs');
            $table->timestamps();
        });

        Schema::create('proforma_request_suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('proforma_requests')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proforma_request_suppliers');
        Schema::dropIfExists('proforma_request_items');
        Schema::dropIfExists('proforma_requests');
    }
};
