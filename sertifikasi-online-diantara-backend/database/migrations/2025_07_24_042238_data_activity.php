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

        Schema::create('data_activity_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_name');
            $table->timestamps();
        });

        Schema::create('data_activity', function (Blueprint $table) {
            $table->id();
            $table->string('activity_name');
            $table->foreignId('activity_type_id')
                  ->references('id')
                  ->on('data_activity_types')
                  ->constrained();
            $table->text('description')->nullable();
            $table->enum('status', ['Aktif', 'Pending', 'Tidak ada template'])->default('Tidak ada template');
            $table->dateTime('date')->nullable();
            $table->foreignId('instruktur_id')->nullable()->constrained('instrukturs');
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            $table->unsignedBigInteger('sertifikat_id')->nullable();
            $table->foreign('sertifikat_id')->references('id')->on('sertifikats')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_activity', function (Blueprint $table) {
            $table->dropForeign(['instruktur_id']);
            $table->dropColumn('instruktur_id');
            $table->dropColumn('time_start');
            $table->dropColumn('time_end');
            $table->dropForeign(['sertifikat_id']);
            $table->dropColumn('sertifikat_id');
        });
        
        Schema::dropIfExists('data_activity');
        Schema::dropIfExists('data_activity_types');
    }
};
