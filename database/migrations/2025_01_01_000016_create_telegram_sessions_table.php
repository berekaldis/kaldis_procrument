<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_sessions', function (Blueprint $table) {
            $table->string('chat_id')->primary();
            $table->string('language', 5)->nullable();
            $table->string('pending_action')->nullable();
            $table->json('pending_payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_sessions');
    }
};
