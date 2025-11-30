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
            // Hapus kolom download_count
            if (Schema::hasColumn('certificate_downloads', 'download_count')) {
                $table->dropColumn('download_count');
            }
            
            // Hapus kolom instruktur_name
            if (Schema::hasColumn('certificate_downloads', 'instruktur_name')) {
                $table->dropColumn('instruktur_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_downloads', function (Blueprint $table) {
            // Restore kolom download_count
            $table->integer('download_count')->default(0)->after('user_id');
            
            // Restore kolom instruktur_name
            $table->string('instruktur_name')->nullable()->after('recipient_name');
        });
    }
};
