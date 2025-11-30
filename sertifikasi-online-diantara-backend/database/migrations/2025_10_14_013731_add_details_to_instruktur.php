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
        // LANGKAH 1: tambah kolom sebagai nullable dulu
        Schema::table('instrukturs', function (Blueprint $table) {
            $table->string('phone_number')->nullable();
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])->nullable();

            // awalnya nullable supaya tidak gagal untuk data lama
            $table->string('asal_institusi')->nullable();
            $table->string('jabatan')->nullable();
        });

        // LANGKAH 2: backfill nilai NULL agar bisa di-set NOT NULL
        DB::table('instrukturs')->whereNull('asal_institusi')->update(['asal_institusi' => '-']);
        DB::table('instrukturs')->whereNull('jabatan')->update(['jabatan' => '-']);

        // Lalu ubah jadi NOT NULL (MySQL)
        DB::statement('ALTER TABLE instrukturs MODIFY COLUMN asal_institusi VARCHAR(255) NOT NULL;');
        DB::statement('ALTER TABLE instrukturs MODIFY COLUMN jabatan VARCHAR(255) NOT NULL;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('instrukturs', function (Blueprint $table) {
            //
            $table->dropColumn(['phone_number', 'address', 'jenis_kelamin', 'asal_institusi', 'jabatan']);
        });
    }
};
