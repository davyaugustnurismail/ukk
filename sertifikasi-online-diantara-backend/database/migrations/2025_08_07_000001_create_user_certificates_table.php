<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('certificate_download_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('active'); // active, revoked
            $table->timestamp('assigned_at');
            $table->timestamps();

            $table->string('qrcode_path')->nullable();

            // Memastikan satu user hanya memiliki satu record untuk satu sertifikat
            $table->unique(['user_id', 'certificate_download_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_certificates');
        Schema::table('user_certificates', function (Blueprint $table) {
            $table->dropColumn('unique_code');
            $table->dropColumn('qrcode_path');
        });
    }
};
