<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('certificate_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('token')->unique();
            $table->json('payload')->nullable();
            $table->string('status')->default('pending'); // pending, processing, done, failed
            $table->integer('total')->nullable();
            $table->integer('processed')->default(0);
            $table->text('errors')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('certificate_tasks');
    }
};
