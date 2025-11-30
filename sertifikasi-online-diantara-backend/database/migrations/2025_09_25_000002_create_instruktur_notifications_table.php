<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('instruktur_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('instruktur_id')->index();
            $table->string('message');
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            // Optional foreign key if instrukturs table exists
            // Uncomment if you want FK constraints
            // $table->foreign('instruktur_id')->references('id')->on('instrukturs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('instruktur_notifications');
    }
};
