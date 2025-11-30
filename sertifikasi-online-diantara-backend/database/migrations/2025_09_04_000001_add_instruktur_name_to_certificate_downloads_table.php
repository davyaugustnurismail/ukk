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
        Schema::table('certificate_downloads', function (Blueprint $table) {
            if (!Schema::hasColumn('certificate_downloads', 'instruktur_name')) {
                $table->string('instruktur_name')->nullable()->after('recipient_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_downloads', function (Blueprint $table) {
            if (Schema::hasColumn('certificate_downloads', 'instruktur_name')) {
                $table->dropColumn('instruktur_name');
            }
        });
    }
};
