<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proformas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('proforma_requests')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->string('reference_no')->nullable();
            $table->text('message')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_type')->nullable();
            $table->string('telegram_message_id')->nullable();
            $table->string('received_via')->default('telegram');
            $table->string('status')->default('received');
            $table->text('notes')->nullable();
            $table->dateTime('received_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proformas');
    }
};
