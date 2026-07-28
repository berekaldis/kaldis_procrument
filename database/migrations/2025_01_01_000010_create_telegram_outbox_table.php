<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_outbox', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('supplier_name')->nullable();
            $table->string('chat_id')->nullable();
            $table->text('message');
            $table->string('status')->default('pending');
            $table->text('error')->nullable();
            $table->text('payload')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_outbox');
    }
};
