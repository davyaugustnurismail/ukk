<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('certificate_downloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sertifikat_id')->constrained('sertifikats')->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->string('filename');
            $table->string('recipient_name');
            $table->string('certificate_number');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->timestamp('expires_at')->nullable();
            $table->integer('download_count')->default(0);
            $table->timestamps();
            
            $table->index('token');
            $table->index(['sertifikat_id', 'certificate_number']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('certificate_downloads');
    }
};
