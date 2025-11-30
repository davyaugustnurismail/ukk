<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1) Tambah kolom sebagai nullable dulu
        Schema::table('data_activity', function (Blueprint $table) {
            $table->string('location')->nullable();
        });

        // 2) Backfill baris-baris lama yang NULL
        //    (ganti 'Unknown' sesuai kebutuhanmu, bisa 'Bandung', '-', dsb)
        DB::table('data_activity')
            ->whereNull('location')
            ->update(['location' => 'Unknown']);

        // 3) Jadikan kolom NOT NULL (tanpa butuh doctrine/dbal)
        DB::statement('ALTER TABLE data_activity MODIFY COLUMN location VARCHAR(255) NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_activity', function (Blueprint $table) {
            $table->dropColumn('location');
        });
    }
};
