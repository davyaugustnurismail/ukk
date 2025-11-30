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
        Schema::create('sertifikats', function (Blueprint $table) {
            $table->id();
            $table->string('name');                    // Nama template
            $table->text('background_image')->nullable(); // Path gambar background
            $table->longText('layout')->nullable();    // Layout dalam format JSON
            $table->longText('elements')->nullable();  // Elemen-elemen dalam format JSON
            $table->boolean('is_active')->default(true);
            $table->string('certificate_number_format')->nullable();
            $table->unsignedBigInteger('last_certificate_number')->default(0);
            $table->timestamps();
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sertifikats');
        Schema::table('sertifikats', function (Blueprint $table) {
            $table->dropColumn('certificate_number_format');
            $table->dropColumn('last_certificate_number');
        });
        
    }
};
