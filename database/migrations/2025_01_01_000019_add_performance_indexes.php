<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->index('verification_status');
            $table->index('active');
        });

        Schema::table('proforma_requests', function (Blueprint $table) {
            $table->index(['status', 'deadline']);
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->index('status');
            $table->index('received_at');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('timestamp');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropIndex(['verification_status']);
            $table->dropIndex(['active']);
        });

        Schema::table('proforma_requests', function (Blueprint $table) {
            $table->dropIndex(['status', 'deadline']);
        });

        Schema::table('proformas', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['received_at']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['timestamp']);
        });
    }
};
