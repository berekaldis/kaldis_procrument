<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bot_state', function (Blueprint $table) {
            $table->string('id')->default('singleton')->primary();
            $table->integer('last_update_id')->default(0);
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_state');
    }
};
