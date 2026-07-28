<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('role')->nullable();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->boolean('read')->default(false);
            $table->string('link')->nullable();
            $table->timestamps();
            $table->index('read');
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
