<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds a nullable boolean `generated` column to data_activity (default false).
     */
    public function up(): void
    {
        if (!Schema::hasTable('data_activity')) return;

        Schema::table('data_activity', function (Blueprint $table) {
            if (!Schema::hasColumn('data_activity', 'generated')) {
                $table->boolean('generated')->default(false)->after('last_certificate_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('data_activity')) return;

        Schema::table('data_activity', function (Blueprint $table) {
            if (Schema::hasColumn('data_activity', 'generated')) {
                $table->dropColumn('generated');
            }
        });
    }
};
