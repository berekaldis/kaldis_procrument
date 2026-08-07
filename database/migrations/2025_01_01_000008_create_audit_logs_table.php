<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor')->nullable();
            $table->string('entity', 100)->nullable();
            $table->string('entity_id', 100)->nullable();
            $table->string('action')->nullable();
            $table->text('details')->nullable();
            $table->dateTime('timestamp');
            $table->index(['entity', 'entity_id']);
            $table->index('action');
            $table->index('actor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
