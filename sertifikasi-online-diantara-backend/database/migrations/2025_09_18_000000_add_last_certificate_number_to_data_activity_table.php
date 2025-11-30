<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('data_activity', function (Blueprint $table) {
            if (!Schema::hasColumn('data_activity', 'last_certificate_number')) {
                $table->unsignedBigInteger('last_certificate_number')->default(0)->after('merchant_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_activity', function (Blueprint $table) {
            if (Schema::hasColumn('data_activity', 'last_certificate_number')) {
                $table->dropColumn('last_certificate_number');
            }
        });
    }
};
