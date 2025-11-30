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
            $table->unsignedBigInteger('data_activity_id')->nullable();
            $table->foreign('data_activity_id')->references('id')->on('data_activity')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_downloads', function (Blueprint $table) {
            $table->dropColumn('data_activity_id');
        });
    }
};
