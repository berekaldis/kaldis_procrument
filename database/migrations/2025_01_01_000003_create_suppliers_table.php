<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('legal_name');
            $table->string('trade_name')->nullable();
            $table->string('trade_license_no')->nullable();
            $table->string('tin')->nullable();
            $table->string('vat_no')->nullable();
            $table->string('category_tags')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('telegram_chat_id')->nullable();
            $table->string('telegram_username')->nullable();
            $table->string('payment_terms')->nullable();
            $table->text('bank_details')->nullable();
            $table->string('verification_status')->default('unverified');
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
