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
        Schema::table('data_activity_user', function (Blueprint $table) {
            if (!Schema::hasColumn('data_activity_user', 'certificate_number')) {
                $table->string('certificate_number')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('data_activity_user', 'tanggal_sertifikat')) {
                $table->date('tanggal_sertifikat')->nullable()->after('certificate_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_activity_user', function (Blueprint $table) {
            if (Schema::hasColumn('data_activity_user', 'tanggal_sertifikat')) {
                $table->dropColumn('tanggal_sertifikat');
            }
            if (Schema::hasColumn('data_activity_user', 'certificate_number')) {
                $table->dropColumn('certificate_number');
            }
        });
    }
};
